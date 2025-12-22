# Troubleshooting Guide

## Error: "Failed to fetch" when clicking Stripe button

This is a CORS (Cross-Origin Resource Sharing) error. Here's how to fix it:

### Solution 1: Check Google Apps Script Deployment Settings ✅

The most common cause is incorrect deployment settings.

1. **Open Google Apps Script:**
   - Go to your Google Sheet
   - Click **Extensions > Apps Script**

2. **Check Your Deployment:**
   - Click **Deploy** (top right) → **Manage deployments**
   - Click the **pencil icon (✏️)** to edit

3. **Verify These Settings:**
   ```
   Execute as: Me (your@email.com)
   Who has access: Anyone
   ```

4. **If settings are wrong:**
   - Change "Who has access" to **Anyone**
   - Click **Deploy**
   - Copy the NEW Web app URL
   - Update `GOOGLE_SCRIPT_URL` in `index.html`

### Solution 2: Create a Fresh Deployment

If the above doesn't work, create a brand new deployment:

1. In Apps Script, click **Deploy > New deployment**
2. Click the gear icon ⚙️ → Select **Web app**
3. Description: "Stripe Integration v2"
4. Execute as: **Me**
5. Who has access: **Anyone**
6. Click **Deploy**
7. Click **Authorize access** (if prompted)
8. Copy the new URL
9. Update in `index.html`:
   ```javascript
   const GOOGLE_SCRIPT_URL = "YOUR_NEW_URL_HERE";
   ```

### Solution 3: Test the Script Directly

Test if your Google Apps Script is working:

1. Copy your script URL
2. Open a new browser tab
3. Visit: `YOUR_SCRIPT_URL`
4. You should see: "Order system is working!"

If you see an error or permission denied, the deployment isn't set up correctly.

### Solution 4: Check Browser Console

1. Open your order page
2. Press **F12** (or Cmd+Option+I on Mac)
3. Go to the **Console** tab
4. Try to submit an order again
5. Look for error messages

**Common errors:**

| Error Message | Solution |
|--------------|----------|
| `Failed to fetch` | Check deployment settings (Solution 1) |
| `CORS error` | Change "Who has access" to "Anyone" |
| `401 Unauthorized` | Re-authorize the script |
| `Stripe API key not configured` | Add your Stripe key to line 6 |
| `Invalid request` | Check that order data is being sent correctly |

### Solution 5: Check Stripe API Key

1. Open Apps Script
2. Check line 6:
   ```javascript
   const STRIPE_SECRET_KEY = 'sk_live_...';
   ```
3. Make sure it's not still the placeholder
4. Test your key at https://dashboard.stripe.com/test/apikeys

### Solution 6: Update URLs for Custom Domain

If you're using `irisliu.io`, update the URLs in Apps Script:

```javascript
const SUCCESS_URL = 'https://irisliu.io/rashguard/?payment=success';
const CANCEL_URL = 'https://irisliu.io/rashguard/?payment=cancelled';
```

Then save and **re-deploy** (Deploy > Manage deployments > Edit > New version > Deploy).

## Testing Checklist

After making changes, test in this order:

- [ ] Visit script URL directly - should show "Order system is working!"
- [ ] Check browser console (F12) - no CORS errors
- [ ] Try submitting a Venmo order - should work (this tests basic order recording)
- [ ] Try submitting a Stripe order - button should show "Creating checkout..."
- [ ] Check console logs - should show request/response data
- [ ] Complete Stripe payment with test card (4242 4242 4242 4242)
- [ ] Verify redirect back to site with success message
- [ ] Check order in Google Sheets

## Still Not Working?

### Get Detailed Error Info

Add this to your browser console:

```javascript
// Check if GOOGLE_SCRIPT_URL is set
console.log('Script URL:', GOOGLE_SCRIPT_URL);

// Check if order data exists
console.log('Pending order:', window.pendingOrder);

// Test the endpoint manually
fetch(GOOGLE_SCRIPT_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain' },
  body: JSON.stringify({ action: 'test' })
})
.then(r => r.text())
.then(d => console.log('Response:', d))
.catch(e => console.error('Error:', e));
```

### Check Google Apps Script Logs

1. Go to Extensions > Apps Script
2. Click **Executions** (left sidebar, clock icon)
3. Look for recent executions
4. Click on any failed execution to see error details

### Common Fixes Summary

| Problem | Quick Fix |
|---------|-----------|
| Failed to fetch | Redeploy script with "Anyone" access |
| Stripe key error | Add real Stripe key, save, redeploy |
| Wrong URL | Update SUCCESS_URL and CANCEL_URL |
| Authorization error | Re-authorize script during deployment |
| Order not recorded | Check Apps Script execution logs |

## Need More Help?

1. **Check the Console** (F12) - Most errors show here
2. **Check Apps Script Logs** - Server-side errors show here  
3. **Test Each Step** - Follow the testing checklist above
4. **Try Venmo/Zelle First** - If these work, it's Stripe-specific

## Working Alternative

If Stripe integration continues to fail, you can use the simple payment link approach:

In `index.html`, replace the Stripe button handler with:

```javascript
document.getElementById("stripeBtn").addEventListener("click", async () => {
  await submitOrderToGoogleSheets('Stripe');
  window.open('https://buy.stripe.com/YOUR_PAYMENT_LINK', '_blank');
  showThankYouMessage();
});
```

This isn't as seamless (customer must enter amount), but it works without backend API calls.

---

**Most Common Solution:** Redeploy the Apps Script with "Anyone" access, then clear your browser cache and try again!

