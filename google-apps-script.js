// Google Apps Script to receive orders and write to Google Sheets
// Deploy this as a Web App in Google Apps Script

// ⚠️ IMPORTANT: Add your Stripe Secret Key here
// Get it from: https://dashboard.stripe.com/apikeys
const STRIPE_SECRET_KEY = 'STRIPE_SECRET_KEY_HERE';
const STRIPE_API_URL = 'https://api.stripe.com/v1/checkout/sessions';

// Your website URL (update this after deployment)
const SUCCESS_URL = 'https://irisliu.io/?payment=success';
const CANCEL_URL = 'https://irisliu.io/?payment=cancelled';

function doPost(e) {
  try {
    // Log the incoming request for debugging
    Logger.log('Received POST request');
    Logger.log('Post data: ' + e.postData.contents);
    
    const data = JSON.parse(e.postData.contents);
    
    // Handle Stripe checkout session creation
    if (data.action === 'create_stripe_session') {
      return createStripeCheckoutSession(data);
    }
    
    // Handle order recording
    if (data.action === 'record_order') {
      return recordOrder(data);
    }
    
    // Default: record order (backward compatibility)
    return recordOrder(data);
    
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function createStripeCheckoutSession(data) {
  try {
    if (STRIPE_SECRET_KEY === 'sk_test_YOUR_STRIPE_SECRET_KEY_HERE') {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Stripe API key not configured'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Calculate amounts in cents (Stripe requires smallest currency unit)
    const amountInCents = Math.round(data.total * 100);
    
    // Create line items description
    const rashguardOrders = Object.entries(data.items.rashguard || {})
      .filter(([_, qty]) => qty > 0)
      .map(([size, qty]) => `Rashguard ${size} x${qty}`)
      .join(', ');
    
    const shortsOrders = Object.entries(data.items.shorts || {})
      .filter(([_, qty]) => qty > 0)
      .map(([size, qty]) => `Shorts ${size} x${qty}`)
      .join(', ');
    
    const orderDescription = [rashguardOrders, shortsOrders]
      .filter(item => item)
      .join(' • ');
    
    // Prepare Stripe API request
    const payload = {
      'payment_method_types[]': 'card',
      'line_items[0][price_data][currency]': 'usd',
      'line_items[0][price_data][unit_amount]': amountInCents,
      'line_items[0][price_data][product_data][name]': 'All Heart All In - Rashguard & Shorts',
      'line_items[0][price_data][product_data][description]': orderDescription,
      'line_items[0][quantity]': 1,
      'mode': 'payment',
      'success_url': SUCCESS_URL,
      'cancel_url': CANCEL_URL,
      'customer_email': data.email,
      'metadata[customer_name]': data.name,
      'metadata[phone]': data.phone,
      'metadata[order_details]': orderDescription
    };
    
    // Convert payload to URL-encoded format
    const formData = Object.keys(payload)
      .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(payload[key]))
      .join('&');
    
    // Make API request to Stripe
    const options = {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + STRIPE_SECRET_KEY,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      payload: formData,
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(STRIPE_API_URL, options);
    const responseCode = response.getResponseCode();
    const responseData = JSON.parse(response.getContentText());
    
    Logger.log('Stripe API Response Code: ' + responseCode);
    Logger.log('Stripe API Response: ' + JSON.stringify(responseData));
    
    if (responseCode === 200) {
      // Store the pending order data temporarily (will be recorded after successful payment)
      const cache = CacheService.getScriptCache();
      cache.put(responseData.id, JSON.stringify(data), 3600); // Store for 1 hour
      
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        sessionId: responseData.id,
        url: responseData.url
      })).setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Stripe API error: ' + (responseData.error ? responseData.error.message : 'Unknown error')
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
  } catch (error) {
    Logger.log('Stripe Error: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Error creating Stripe session: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function recordOrder(data) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Add headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Timestamp',
        'Name',
        'Email',
        'Phone',
        'IG Handle',
        'Payment Method',
        'Street',
        'City',
        'State',
        'Zip Code',
        'Country',
        'Rashguard Orders',
        'Shorts Orders',
        'Total',
        'Donation (15%)',
        'Payment Status'
      ]);
    }
    
    // Format order details
    const rashguardOrders = Object.entries(data.items.rashguard || {})
      .map(([size, qty]) => `${size} x${qty}`)
      .join(', ') || 'None';
    
    const shortsOrders = Object.entries(data.items.shorts || {})
      .map(([size, qty]) => `${size} x${qty}`)
      .join(', ') || 'None';
    
    const donation = (data.total * 0.15).toFixed(2);
    
    // Append row with order data
    sheet.appendRow([
      new Date(),
      data.name,
      data.email,
      data.phone,
      data.handle || '',
      data.payment,
      data.street,
      data.city,
      data.state,
      data.zipcode,
      data.country,
      rashguardOrders,
      shortsOrders,
      `$${data.total}`,
      `$${donation}`,
      data.paymentStatus || 'Pending'
    ]);
    
    Logger.log('Order recorded successfully');
    
    // Send notification email to owner
    sendOwnerNotification(data, rashguardOrders, shortsOrders, donation);
    
    // Send email if payment method is Venmo or Zelle
    if (data.payment === 'Venmo' || data.payment === 'Zelle') {
      Logger.log('Sending payment instruction email for ' + data.payment);
      sendPaymentInstructionEmail(data, rashguardOrders, shortsOrders, donation);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Order recorded successfully'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Error recording order: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function sendOwnerNotification(data, rashguardOrders, shortsOrders, donation) {
  const ownerEmail = 'irisliu.bjj@gmail.com'; // Your email
  const subject = `🎉 New Order: ${data.name} - $${data.total}`;
  
  const emailBody = `
You have received a new order!

ORDER DETAILS:
--------------
Customer: ${data.name}
Email: ${data.email}
Phone: ${data.phone}
IG Handle: ${data.handle || 'N/A'}

ITEMS ORDERED:
--------------
Rashguard: ${rashguardOrders}
Shorts: ${shortsOrders}

PAYMENT:
--------
Payment Method: ${data.payment}
Total: $${data.total}
Donation (15%): $${donation}
Payment Status: ${data.paymentStatus || 'Pending'}

SHIPPING ADDRESS:
-----------------
${data.street}
${data.city}, ${data.state} ${data.zipcode}
${data.country}

${data.payment === 'Stripe' ? '✅ Customer paid via Stripe - Check your Stripe dashboard' : '⏳ Waiting for ' + data.payment + ' payment'}

---
View all orders in your Google Sheet.
`;

  try {
    MailApp.sendEmail({
      to: ownerEmail,
      subject: subject,
      body: emailBody,
      name: 'Rashguard Order System'
    });
    Logger.log('Owner notification sent to: ' + ownerEmail);
  } catch (emailError) {
    Logger.log('Error sending owner notification: ' + emailError);
    // Don't fail the order if notification fails
  }
}

function sendPaymentInstructionEmail(data, rashguardOrders, shortsOrders, donation) {
  const subject = "All Heart All In - Payment Instructions for Your Order";
  
  // Determine which payment method to show
  let paymentInstructions = '';
  
  if (data.payment === 'Venmo') {
    paymentInstructions = `
VENMO PAYMENT INSTRUCTIONS:
---------------------------
• Send $${data.total} to @irisliucy
• In the note, include: "${data.name} - Rashguard Order"
`;
  } else if (data.payment === 'Zelle') {
    paymentInstructions = `
ZELLE PAYMENT INSTRUCTIONS:
---------------------------
• Send $${data.total} to irisliu.0616@gmail.com
• In the memo, include: "${data.name} - Rashguard Order"
`;
  } else {
    // Show both if payment method is somehow not specified
    paymentInstructions = `
PAYMENT INSTRUCTIONS:
---------------------

Option 1: Venmo
• Send $${data.total} to @irisliucy
• In the note, include: "${data.name} - Rashguard Order"

Option 2: Zelle
• Send $${data.total} to irisliu.0616@gmail.com
• In the memo, include: "${data.name} - Rashguard Order"
`;
  }
  
  const emailBody = `
Hi ${data.name},

Thank you for your order! Here are the details:

ORDER SUMMARY:
--------------
Rashguard: ${rashguardOrders}
Shorts: ${shortsOrders}

Total: $${data.total}
Donation to Tap Cancer Out (15%): $${donation} (included)

SHIPPING ADDRESS:
-----------------
${data.street}
${data.city}, ${data.state} ${data.zipcode}
${data.country}

${paymentInstructions}

Once payment is received, we'll process your order and send you a shipping confirmation.

Questions? Contact us:
• Instagram: @irisliu.bjj
• Email: irisliu.0616@gmail.com

Thank you for supporting myself and Tap Cancer Out!

Yours sincerely,
Iris Liu
All Heart All In ❤️
`;

  try {
    MailApp.sendEmail({
      to: data.email,
      subject: subject,
      body: emailBody,
      name: 'Iris Liu - All Heart All In',
      replyTo: 'irisliu.bjj@gmail.com'
    });
  } catch (emailError) {
    console.error('Error sending email:', emailError);
    // Continue anyway - order is still recorded
  }
}

// Test function to verify setup
function doGet() {
  return ContentService.createTextOutput('Order system is working!');
}

