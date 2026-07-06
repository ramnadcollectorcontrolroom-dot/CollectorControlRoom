# Live Deployment & Setup Guide - Ramanathapuram Control Room Portal

This guide provides step-by-step instructions to connect this portal to a live **Google Sheets** database, configure automated **email notifications**, and host the web application on **GitHub Pages** for free.

---

## 📋 Table of Contents
1. [Step 1: Set Up the Google Spreadsheet](#step-1-set-up-the-google-spreadsheet)
2. [Step 2: Deploy Google Apps Script Web App](#step-2-deploy-google-apps-script-web-app)
3. [Step 3: Connect Frontend to the Google Sheets Database](#step-3-connect-frontend-to-the-google-sheets-database)
4. [Step 4: Customize Department Notification Emails](#step-4-customize-department-notification-emails)
5. [Step 5: Deploy Frontend to GitHub Pages](#step-5-deploy-frontend-to-github-pages)

---

## Step 1: Set Up the Google Spreadsheet

1. Open your browser and navigate to [Google Sheets](https://sheets.google.com).
2. Create a new blank spreadsheet.
3. Rename the spreadsheet to **Ramanathapuram Control Room Complaints**.
4. Double-click the sheet tab name at the bottom and rename it to **Complaints** (must match exactly, case-sensitive).
5. Add the following headers in row 1 (columns A to L):
   - **Column A**: `Complaint ID`
   - **Column B**: `Date`
   - **Column C**: `Time`
   - **Column D**: `Citizen Name`
   - **Column E**: `Mobile Number`
   - **Column F**: `Village`
   - **Column G**: `Taluk`
   - **Column H**: `Department`
   - **Column I**: `Complaint Description`
   - **Column J**: `Priority`
   - **Column K**: `Status`
   - **Column L**: `Remarks`

---

## Step 2: Deploy Google Apps Script Web App

1. Inside your new Google Spreadsheet, click **Extensions** in the top menu and select **Apps Script**.
2. Erase any default code in the editor (`myFunction()`).
3. Open [Code.gs](file:///d:/RMDCCR/Code.gs) from this project folder, copy all code, and paste it into the Apps Script editor.
4. Click the **Save** (disk icon) button at the top or press `Ctrl + S`.
5. Click the blue **Deploy** button at the top-right and select **New deployment**.
6. Click the gear icon next to "Select type" and select **Web app**.
7. Configure the settings exactly as follows:
   - **Description**: `Ramanathapuram Control Room API`
   - **Execute as**: `Me (your-email@gmail.com)` (This allows the script to write database rows and trigger emails from your account).
   - **Who has access**: `Anyone` (This is required so the frontend site can communicate with the API).
8. Click **Deploy**.
9. Google will request you to **Authorize Access**. Click **Authorize Access**, sign in to your Google Account, click **Advanced** at the bottom, and select **Go to Untitled project (unsafe)** or **Go to Ramanathapuram API (unsafe)**. Click **Allow**.
10. Once the deployment completes, copy the **Web App URL** shown under "URL" (it ends with `/exec`). Save this URL.

---

## Step 3: Connect Frontend to the Google Sheets Database

1. Open your local copy of `index.html` in any web browser and log in:
   - **Username**: `admin`
   - **Password**: `controlroom@rmd`
2. Scroll to the bottom of the **Dashboard** view.
3. Paste the copied Apps Script Web App URL into the **Google Apps Script API URL** input field.
4. Click **Save**.
5. The warning banner at the top will disappear.
6. Click the **Sync/Refresh** (circular arrow) button next to the header session clock. A spinner will show, and your complaints will synchronize with Google Sheets! Any new complaint you register now will instantly write to the spreadsheet.

> [!NOTE]
> Setting the API URL stores the key securely inside the browser's `localStorage`. Each machine running the portal will store its configuration. If you clear browser history or use another device, you will need to re-enter this URL.

---

## Step 4: Customize Department Notification Emails

By default, when a complaint is registered, the Apps Script sends an email notification to the department responsible for solving it.

1. Open the **Apps Script editor** again.
2. Near the top of the script, look for the `DEPARTMENT_EMAILS` object definition:
   ```javascript
   var DEPARTMENT_EMAILS = {
     "Revenue": "revenue.rmd@example.com",
     "Police": "police.rmd@example.com",
     ...
   };
   ```
3. Replace the placeholder email addresses (e.g., `revenue.rmd@example.com`) with the actual email addresses of the departmental contact officers in Ramanathapuram.
4. Replace `DEFAULT_EMAIL = "controlroom.rmd@example.com"` with your main control room monitoring email address.
5. Click **Save**.
6. **IMPORTANT**: Every time you modify Apps Script code, you must redeploy it:
   - Click **Deploy** -> **Manage deployments**.
   - Click the pencil icon (Edit) on the active deployment.
   - Under "Version", select **New version**.
   - Click **Deploy**. The Web App URL will remain the same.

---

## Step 5: Deploy Frontend to GitHub Pages

To make the portal accessible to all operators across the District Control Room, deploy it to GitHub Pages:

1. Create a new free repository on [GitHub](https://github.com) named `rmd-control-room-portal`.
2. Push your project files (`index.html`, `style.css`, `app.js`, `README.md`) to the repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Control Room Portal"
   git remote add origin https://github.com/your-username/rmd-control-room-portal.git
   git branch -M main
   git push -u origin main
   ```
3. Once pushed, go to your repository on GitHub.com.
4. Click on **Settings** (gear icon) in the repository tabs.
5. Scroll down the left sidebar, click **Pages** (under the "Code and automation" section).
6. Under **Build and deployment**, set **Source** to `Deploy from a branch`.
7. Under **Branch**, select `main` (or `master`) and folder `/ (root)`. Click **Save**.
8. Wait 1-2 minutes. GitHub will display a message at the top of the Pages settings panel:
   *`Your site is live at: https://your-username.github.io/rmd-control-room-portal/`*
9. Bookmark this link on all Control Room operator PCs! Log in and enter your live Web App URL.
