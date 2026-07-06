# RMD Grievance - Ramanathapuram Control Room Portal

A simple, user-friendly, and professional Internal Complaint Portal for the **Ramanathapuram District Control Room**. This application helps operators receive public grievances, route them to respective departments via automated emails, and record all grievance history in a centralized database.

---

## 🏗️ Architecture

```
User (Citizen Grievance Call)
          ↓
  Control Room Operator (Inputs Data)
          ↓
  GitHub Pages Portal (Frontend SPA)
          ↓
  Google Apps Script Web App API (CORS-compatible Web Service)
    📍 Writes rows to Google Sheets (Central Database)
    📍 Triggers MailApp notifications to assigned Departments
```

---

## ✨ Features

- **Professional Govt Theme**: Modern styling following professional guidelines with an executive Navy Blue and Soft White palette.
- **KPI Summary Metrics**: Instantly shows Total, Today's, Pending, and Completed complaints.
- **Auto-generated IDs**: Automatically generates a unique sequential complaint ID formatted as `RMD-YYYYMMDD-XXXX` (e.g., `RMD-20260704-0001`).
- **Grievance Registration Intake Form**: Simple responsive form with dropdown selections for Ramanathapuram Taluks and major administrative departments.
- **Directory List & Search**: Live pagination directory enabling searching and filtering by ID, Mobile Number, Village, Department, Status, and Date.
- **Status & Remarks Updates**: Open any complaint from the directory to adjust status (Pending, In Progress, Completed) and add resolution remarks.
- **Chart.js Reports**: Beautiful interactive reporting charts detailing status distribution, priority ratios, and department workloads.
- **A4 Printable Receipts**: Clicking print generates a clean official receipt layout suitable for print or PDF export.
- **Hybrid Data Operations (Mock + Live)**: Falls back to browser `localStorage` mock database if no Google Apps Script API is set up, allowing instant testing.

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+), Bootstrap 5 (Styling & Responsive grid), Font Awesome 6 (Emblem & status iconography).
- **Charts**: Chart.js (Interactive reporting graphs).
- **Backend Database**: Google Sheets (Central Repository).
- **Backend API**: Google Apps Script (Web App REST API).
- **Routing Alerts**: Google Apps Script `MailApp` (Automated Department notifications).
- **Hosting**: GitHub Pages (Static site deployment).

---

## 📂 Project Structure

```
d:/RMDCCR/
│
├── index.html           # Main SPA Shell (Dashboard, Intake, Directory, Charts)
├── style.css            # Custom Styling Theme & Print stylesheet
├── app.js               # Frontend Controllers, CORS Client, and Chart Builders
├── Code.gs              # Google Apps Script Source (Copy-paste to Apps Script Editor)
├── DEPLOYMENT_GUIDE.md  # Step-by-step Live setup & deployment instructions
└── README.md            # System overview and architecture details
```

---

## 💻 Quick Start & Credentials

1. Clone or download these project files into your local directory.
2. Open `index.html` directly in any web browser to run the application immediately in **Mock Mode** using sample data.
3. Use the following default administrative credentials to sign in:
   - **Username**: `admin`
   - **Password**: `controlroom@rmd`
4. Follow [DEPLOYMENT_GUIDE.md](file:///d:/RMDCCR/DEPLOYMENT_GUIDE.md) to set up your live Google Sheet database and host on GitHub Pages.
