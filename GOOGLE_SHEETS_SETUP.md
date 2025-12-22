# Google Sheets Integration Setup

## Step 1: Create Google Sheet

1. Go to https://sheets.google.com
2. Create a new spreadsheet
3. Name it: "Rashguard Pre-Orders"

## Step 2: Add Google Apps Script

1. In your Google Sheet, go to: **Extensions** → **Apps Script**
2. Delete any existing code
3. Copy the entire contents of `google-apps-script.js` and paste it
4. Click **Save** (💾 icon)
5. Name the project: "Order Submission Script"

## Step 3: Deploy as Web App

1. Click **Deploy** → **New deployment**
2. Click the gear icon (⚙️) next to "Select type"
3. Choose **Web app**
4. Fill in:
   - Description: "Order submission endpoint"
   - Execute as: **Me**
   - Who has access: **Anyone** (required for public access)
5. Click **Deploy**
6. Click **Authorize access**
7. Choose your Google account
8. Click **Advanced** → **Go to Order Submission Script (unsafe)**
9. Click **Allow**
10. Copy the **Web app URL** (looks like: `https://script.google.com/macros/s/XXXXXX/exec`)

## Step 4: Add URL to Your Website

1. Open `index.html`
2. Find line ~520: `const GOOGLE_SCRIPT_URL = "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";`
3. Replace with your actual URL:
   ```javascript
   const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_ACTUAL_ID/exec";
   ```

## Step 5: Test

1. Open your website
2. Fill out an order
3. Submit with any payment method
4. Check your Google Sheet - a new row should appear!

## Spreadsheet Columns

The script automatically creates these columns:
- Timestamp
- Name
- Email
- Phone
- IG Handle
- Payment Method
- Street
- City
- State
- Zip Code
- Country
- Rashguard Orders (e.g., "L x2, M x1")
- Shorts Orders (e.g., "S x1")
- Total (e.g., "$170")
- Donation (15%) (e.g., "$25.50")
- Payment Status ("Paid" for Stripe, "Pending Payment" for Venmo/Zelle)

## Troubleshooting

### If orders aren't appearing:

1. Check the Apps Script execution log:
   - Apps Script editor → **Executions** (clock icon on left)
2. Make sure deployment is set to "Anyone" access
3. Try redeploying the web app
4. Make sure you copied the correct Web app URL

### If you need to redeploy:

1. Go to Apps Script editor
2. Click **Deploy** → **Manage deployments**
3. Click the pencil icon (✏️) to edit
4. Change version to "New version"
5. Click **Deploy**
6. Copy the new URL if it changed

