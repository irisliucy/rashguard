# Stripe Dynamic Payment Integration - Implementation Summary

## Overview

We've integrated Stripe API with your order form so that payment amounts are automatically pre-filled in the Stripe Checkout based on the customer's order total. No more manual entry!

## What Changed

### 1. **Google Apps Script Backend** (`google-apps-script.js`)

Added new functionality:

- **`createStripeCheckoutSession()`** - Creates a Stripe Checkout Session via Stripe API
  - Calculates amount in cents (Stripe requirement)
  - Includes order details (Rashguard XL x1, Shorts M x2, etc.)
  - Pre-fills customer email
  - Returns a unique checkout URL with the amount already set

- **Modified `doPost()`** - Now handles two types of requests:
  - `action: 'create_stripe_session'` - Creates Stripe checkout
  - `action: 'record_order'` - Records order in Google Sheets (existing)

- **Configuration Constants**:
  ```javascript
  const STRIPE_SECRET_KEY = 'sk_test_YOUR_KEY_HERE';
  const SUCCESS_URL = 'https://irisliucy.github.io/rashguard-preorder/?payment=success';
  const CANCEL_URL = 'https://irisliucy.github.io/rashguard-preorder/?payment=cancelled';
  ```

### 2. **Frontend HTML** (`index.html`)

Updated Stripe button behavior:

**Before:**
- Showed alert with amount
- Opened static Stripe Payment Link
- User had to manually enter amount

**After:**
- Shows "Creating checkout..." loading state
- Calls backend to create dynamic Stripe session
- Records order in Google Sheets
- Redirects to Stripe Checkout with amount pre-filled
- Handles success/cancel redirects back to site

**New URL Parameter Handling:**
- `?payment=success` - Shows success modal
- `?payment=cancelled` - Shows cancellation message

### 3. **Email Configuration**

Updated to send from your preferred email:
- Display name: "Iris Liu - All Heart All In"
- Reply-to: irisliu.bjj@gmail.com

## Payment Flow

### Stripe Credit Card Payment

```
1. Customer fills out form
   ↓
2. Customer clicks "Pay with Credit Card"
   ↓
3. Frontend calls Google Apps Script: "create_stripe_session"
   ↓
4. Backend calls Stripe API to create checkout session with exact amount
   ↓
5. Backend returns checkout URL
   ↓
6. Frontend records order in Google Sheets (status: "Pending")
   ↓
7. Customer redirected to Stripe Checkout (amount already set!)
   ↓
8. Customer completes payment
   ↓
9. Stripe redirects to: yoursite.com/?payment=success
   ↓
10. Success modal shown automatically
```

### Venmo/Zelle Payment (Unchanged)

```
1. Customer fills out form
   ↓
2. Customer clicks "Pay with Venmo" or "Pay with Zelle"
   ↓
3. Order recorded in Google Sheets
   ↓
4. Automated email sent with payment instructions
   ↓
5. Success modal shown
```

## Files Modified

1. ✅ `index.html` - Updated Stripe button handler, added URL parameter handling
2. ✅ `google-apps-script.js` - Added Stripe API integration and session creation
3. ✅ `STRIPE_SETUP.md` - New setup guide for Stripe API keys
4. ✅ `IMPLEMENTATION_SUMMARY.md` - This file

## Next Steps (Action Required)

### 1. Get Your Stripe API Key

1. Go to https://dashboard.stripe.com/apikeys
2. Toggle **Test mode** ON (for testing)
3. Click "Reveal test key" and copy the secret key (starts with `sk_test_`)

### 2. Update Google Apps Script

1. Open your Google Sheet
2. Go to **Extensions > Apps Script**
3. Replace this line:
   ```javascript
   const STRIPE_SECRET_KEY = 'sk_test_YOUR_STRIPE_SECRET_KEY_HERE';
   ```
   With your actual key:
   ```javascript
   const STRIPE_SECRET_KEY = 'sk_test_51Abc...xyz123';
   ```

4. Update the URLs if using custom domain:
   ```javascript
   const SUCCESS_URL = 'https://irisliu.io/rashguard/?payment=success';
   const CANCEL_URL = 'https://irisliu.io/rashguard/?payment=cancelled';
   ```

5. Save and re-deploy (Deploy > Manage deployments > Edit > New version > Deploy)

### 3. Test the Integration

Use Stripe test card: `1`
- Expiry: Any future date (e.g., 12/34)
- CVC: Any 3 digits (e.g., 123)
- ZIP: Any 5 digits (e.g., 12345)

### 4. Push to GitHub Pages

```bash
cd /Users/irisl/src/rashguard-preorder
git add .
git commit -m "Add Stripe API integration with dynamic amounts"
git push origin main
```

Wait 2-3 minutes for GitHub Pages to update.

### 5. Go Live

Once testing is complete:
1. Get your **live** Stripe key (toggle Test mode OFF)
2. Replace `sk_test_` with `sk_live_` in the script
3. Save and re-deploy
4. Test with a real small payment first!

## Testing Checklist

- [ ] Stripe test key added to Google Apps Script
- [ ] Google Apps Script re-deployed with new version
- [ ] SUCCESS_URL and CANCEL_URL match your domain
- [ ] Test order with $110 total - does Stripe show $110?
- [ ] Test order with $290 total - does Stripe show $290?
- [ ] Complete test payment with 4242... card
- [ ] Verify redirect back to site with success message
- [ ] Check order appears in Google Sheets
- [ ] Test Venmo/Zelle payments still work (email sent)

## Benefits

✅ **No manual amount entry** - Stripe Checkout pre-filled with exact amount  
✅ **Reduced errors** - Customer can't enter wrong amount  
✅ **Professional experience** - Seamless checkout flow  
✅ **Order details** - Stripe receipt includes item breakdown  
✅ **Customer email pre-filled** - Faster checkout  
✅ **Secure** - API key never exposed to frontend  

## Troubleshooting

**"Stripe API key not configured" error**
→ Update `STRIPE_SECRET_KEY` in Google Apps Script

**"Failed to create checkout session" error**
→ Check Apps Script logs (Extensions > Apps Script > Executions)

**Amount not showing in Stripe**
→ Check browser console (F12) for errors

**Payment succeeds but not in Google Sheets**
→ Check Apps Script execution logs for errors

## Support

- See `STRIPE_SETUP.md` for detailed setup instructions
- See `GOOGLE_SHEETS_SETUP.md` for backend setup
- Stripe docs: https://stripe.com/docs/api/checkout/sessions
- Stripe test cards: https://stripe.com/docs/testing#cards

---

**Ready to deploy!** Just add your Stripe API key and push to GitHub Pages.

