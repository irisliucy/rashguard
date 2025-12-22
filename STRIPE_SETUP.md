# Stripe API Integration Setup Guide

This guide will help you set up Stripe with dynamic payment amounts using Google Apps Script as the backend.

## Prerequisites

1. A Stripe account (sign up at https://stripe.com)
2. Google Apps Script already deployed (see GOOGLE_SHEETS_SETUP.md)

## Step 1: Get Your Stripe API Keys

1. Go to https://dashboard.stripe.com/apikeys
2. You'll see two types of keys:
   - **Publishable key** (starts with `pk_`) - Used on the frontend (not needed for our setup)
   - **Secret key** (starts with `sk_`) - Used on the backend

### For Testing (Recommended First)
3. Toggle the "Test mode" switch ON (top right)
4. Copy the **Secret key** (click "Reveal test key")
   - It will look like: `sk_test_xxxxxxxxxxxxx`

### For Live Payments (After Testing)
5. Toggle "Test mode" OFF to see your live keys
6. Copy the **Secret key** (will look like: `sk_live_xxxxxxxxxxxxx`)

## Step 2: Update Google Apps Script

1. Open your Google Sheet
2. Go to **Extensions > Apps Script**
3. Find this line at the top of the script:

```javascript
const STRIPE_SECRET_KEY = 'sk_test_YOUR_STRIPE_SECRET_KEY_HERE';
```

4. Replace `sk_test_YOUR_STRIPE_SECRET_KEY_HERE` with your actual Stripe secret key:

```javascript
const STRIPE_SECRET_KEY = 'sk_test_51Abc...xyz123';
```

5. **Update the SUCCESS_URL and CANCEL_URL** to match your deployed site:

```javascript
const SUCCESS_URL = 'https://irisliucy.github.io/rashguard-preorder/?payment=success';
const CANCEL_URL = 'https://irisliucy.github.io/rashguard-preorder/?payment=cancelled';
```

If you're using a custom domain, update them:

```javascript
const SUCCESS_URL = 'https://irisliu.io/rashguard/?payment=success';
const CANCEL_URL = 'https://irisliu.io/rashguard/?payment=cancelled';
```

6. Click **💾 Save** (or press Ctrl/Cmd + S)

## Step 3: Re-deploy the Script

Since you made changes to the script, you need to deploy a new version:

1. Click **Deploy > Manage deployments**
2. Click the **pencil icon (✏️)** next to your active deployment
3. Under "Version", change it from the current version to **New version**
4. Click **Deploy**
5. Copy the new **Web app URL** if it's different (it shouldn't be)

## Step 4: Test the Integration

### Test with Stripe Test Mode

1. Make sure you're using test keys (`sk_test_...`)
2. Go to your order form
3. Fill in the order details
4. Click **"Pay with Credit Card (Secure via Stripe)"**
5. You should be redirected to a Stripe Checkout page with the exact amount pre-filled

### Use Stripe Test Cards

When testing, use these test card numbers:

| Card Number | Description |
|-------------|-------------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 9995` | Payment declined (insufficient funds) |
| `4000 0025 0000 3155` | Requires authentication (3D Secure) |

- Use any future expiration date (e.g., 12/34)
- Use any 3-digit CVC (e.g., 123)
- Use any 5-digit ZIP code (e.g., 12345)

Full list: https://stripe.com/docs/testing#cards

### What Should Happen

✅ **Success Flow:**
1. Customer fills out the form
2. Clicks "Pay with Credit Card"
3. Redirected to Stripe Checkout with amount already set
4. Completes payment
5. Redirected back to your site with success message
6. Order is recorded in Google Sheets with "Stripe" payment method

❌ **If Something Goes Wrong:**

**Error: "Stripe API key not configured"**
- You haven't updated the `STRIPE_SECRET_KEY` in the script

**Error: "Failed to create checkout session"**
- Check the Google Apps Script logs (Extensions > Apps Script > Execution log)
- Make sure you saved and re-deployed after updating the key

**Payment succeeds but not recorded in sheet:**
- Check that the `recordOrder` function is working
- Look at the Apps Script execution logs for errors

## Step 5: Go Live

Once testing is complete:

1. Get your **live** Stripe secret key (toggle Test mode OFF)
2. Replace the test key in Google Apps Script with the live key:
   ```javascript
   const STRIPE_SECRET_KEY = 'sk_live_xxxxxxxxxxxxx';
   ```
3. Save and re-deploy (new version)
4. Test with a real payment (small amount first!)

## Security Notes

⚠️ **IMPORTANT:**

1. **NEVER** expose your secret key in the HTML file or anywhere public
2. The secret key should **ONLY** be in the Google Apps Script (server-side)
3. Keep your Google Apps Script deployment set to "Execute as: Me" and "Who has access: Anyone"
4. Stripe automatically encrypts all payment data - you never handle card numbers directly

## Monitoring Payments

### In Stripe Dashboard
- View all payments: https://dashboard.stripe.com/payments
- See customer details, amounts, and status
- Issue refunds if needed

### In Google Sheets
- All orders are recorded with payment method "Stripe"
- Payment Status will show "Pending" initially
- You can manually update status after confirming payment in Stripe

## Troubleshooting

### "CORS error" or "Failed to fetch"
- Make sure the Google Apps Script is deployed with "Who has access: Anyone"
- Re-deploy the script

### Amount not showing in Stripe
- Check the browser console (F12) for errors
- Verify `window.pendingOrder.total` has the correct value

### Customer redirected but order not saved
- The order should be saved BEFORE redirect
- Check Google Apps Script execution logs

## Support

- **Stripe Documentation**: https://stripe.com/docs/payments/checkout
- **Stripe Support**: https://support.stripe.com
- **Test Your Integration**: https://stripe.com/docs/testing

---

**Need Help?** Check the Google Apps Script logs (Extensions > Apps Script > Executions) for detailed error messages.

