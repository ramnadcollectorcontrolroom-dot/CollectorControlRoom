/**
   Ramanathapuram District Control Room - Internal Complaint Portal Client Script
   ========================================================================== */

// Configuration
const CONFIG = {
  USERNAME: "admin",
  PASSWORD: "controlroom@rmd",
  API_URL_KEY: "rmd_api_url",
  COMPLAINTS_KEY: "rmd_complaints",
  SESSION_KEY: "rmd_session_active",
  DEFAULT_API_URL: "https://script.google.com/macros/s/AKfycbzE7HTJwqu4ygSYXG0ZGAklRiYetT00nzZbVeOfnTYCCmgrRtCx0Cg6FFj6ABNSbyPu/exec"
  
  
};

// Application State
let state = {
  complaints: [],
  filteredComplaints: [],
  apiUrl: "",
  isMockMode: true,
  currentPage: 1,
  pageSize: 10,
  charts: {
    status: null,
    priority: null,
    department: null
  }
};

// DOM Elements
const views = {
  login: document.getElementById("login-view"),
  portal: document.getElementById("portal-container"),
  dashboard: document.getElementById("dashboard-view"),
  register: document.getElementById("register-view"),
  list: document.getElementById("list-view"),
  reports: document.getElementById("reports-view")
};

// Run on page load
document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

function initApp() {
  // Load configuration
  const savedApiUrl = localStorage.getItem(CONFIG.API_URL_KEY);
  state.apiUrl = savedApiUrl || CONFIG.DEFAULT_API_URL;
  document.getElementById("api-url-input").value = state.apiUrl;

  if (savedApiUrl) {
    state.isMockMode = false;
    document.getElementById("api-warning-banner").classList.add("d-none");
  } else {
    // Persist the default Apps Script deployment URL so the portal starts in live mode automatically.
    localStorage.setItem(CONFIG.API_URL_KEY, state.apiUrl);
    state.isMockMode = false;
    document.getElementById("api-warning-banner").classList.add("d-none");
  }
  
  if (state.apiUrl) {
    state.isMockMode = false;
    document.getElementById("api-warning-banner").classList.add("d-none");
  } else {
    state.isMockMode = true;
    document.getElementById("api-warning-banner").classList.remove("d-none");
  }
  
  // Set DateTime in header
  updateHeaderDateTime();
  setInterval(updateHeaderDateTime, 60000);
  
  // Check session
  const sessionActive = localStorage.getItem(CONFIG.SESSION_KEY) === "true";
  if (sessionActive) {
    showPortalView();
  } else {
    showLoginView();
  }
  
  // Setup Event Listeners
  setupEventListeners();
}

/**
 * Update system time in the header
 */
function updateHeaderDateTime() {
  const now = new Date();
  const options = { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  };
  // Format matching 04-Jul-2026 10:15 AM
  const dateStr = now.toLocaleDateString('en-GB', options).replace(/, /g, ' ');
  document.getElementById("header-datetime").textContent = dateStr;
}

/**
 * Event Listener bindings
 */
function setupEventListeners() {
  // Login Form
  document.getElementById("login-form").addEventListener("submit", handleLogin);
  
  // Logout Button
  document.getElementById("logout-btn").addEventListener("click", handleLogout);
  
  // Navigation Links
  document.querySelectorAll("#sidebar .nav-link").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = link.getAttribute("data-target");
      navigateTo(target);
    });
  });
  
  // Toggle Sidebar Menu
  document.getElementById("toggle-sidebar-btn").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("active");
  });
  document.getElementById("close-sidebar-btn").addEventListener("click", () => {
    document.getElementById("sidebar").classList.remove("active");
  });
  
  // Refresh Data Button
  document.getElementById("refresh-data-btn").addEventListener("click", () => {
    fetchData();
  });
  
  // Save API URL Button
  document.getElementById("save-api-url-btn").addEventListener("click", () => {
    const inputUrl = document.getElementById("api-url-input").value.trim();
    if (inputUrl) {
      localStorage.setItem(CONFIG.API_URL_KEY, inputUrl);
      state.apiUrl = inputUrl;
      state.isMockMode = false;
      document.getElementById("api-warning-banner").classList.add("d-none");
      showToast("Google Apps Script API URL saved successfully.", "success");
    } else {
      localStorage.removeItem(CONFIG.API_URL_KEY);
      state.apiUrl = "";
      state.isMockMode = true;
      document.getElementById("api-warning-banner").classList.remove("d-none");
      showToast("API URL cleared. Operating in Mock Mode.", "info");
    }
    fetchData(); // Reload data
  });

  // Reset Demo Data Button
  document.getElementById("reset-demo-data-btn").addEventListener("click", () => {
    resetDemoData();
  });
  
  // Register Complaint Form Submission
  document.getElementById("register-complaint-form").addEventListener("submit", handleRegisterComplaint);
  
  // Form Clear Button
  document.getElementById("clear-form-btn").addEventListener("click", () => {
    resetRegistrationForm();
    showToast("Form cleared.", "info");
  });
  
  // Form Print Draft Button
  document.getElementById("print-form-btn").addEventListener("click", () => {
    printFormDraft();
  });
  
  // Search Filter Form
  document.getElementById("search-filter-form").addEventListener("submit", handleSearch);
  document.getElementById("reset-search-btn").addEventListener("click", handleSearchReset);
  
  // Modal Update Save Button
  document.getElementById("modal-save-btn").addEventListener("click", handleModalUpdate);
  
  // Modal Print Receipt Button
  document.getElementById("modal-print-btn").addEventListener("click", () => {
    const currentId = document.getElementById("modal-id").textContent;
    printComplaintReceipt(currentId);
  });
}

/* ==================== AUTHENTICATION FLOW ==================== */
function handleLogin(e) {
  e.preventDefault();
  const usernameInput = document.getElementById("username").value.trim();
  const passwordInput = document.getElementById("password").value;
  const errorAlert = document.getElementById("login-error");
  
  if (usernameInput === CONFIG.USERNAME && passwordInput === CONFIG.PASSWORD) {
    errorAlert.classList.add("d-none");
    localStorage.setItem(CONFIG.SESSION_KEY, "true");
    showPortalView();
  } else {
    errorAlert.classList.remove("d-none");
    document.getElementById("password").value = "";
    showToast("Login failed. Check credentials.", "error");
  }
}

function handleLogout() {
  localStorage.removeItem(CONFIG.SESSION_KEY);
  showLoginView();
  showToast("Logged out successfully.", "info");
}

function showLoginView() {
  views.login.classList.remove("d-none");
  views.portal.classList.add("d-none");
  document.body.classList.remove("bg-light");
  document.body.style.backgroundColor = "#02153c";
}

function showPortalView() {
  views.login.classList.add("d-none");
  views.portal.classList.remove("d-none");
  document.body.classList.add("bg-light");
  document.body.removeAttribute("style");
  
  // Pre-fill Date & Time on intake screen
  resetRegistrationForm();
  
  // Initial fetch
  fetchData();
  
  // Default landing
  navigateTo("dashboard-view");
}

/**
 * Handle SPA navigation
 */
function navigateTo(viewId) {
  // Hide all sections
  document.querySelectorAll(".view-section").forEach(sec => sec.classList.add("d-none"));
  
  // Show target section
  document.getElementById(viewId).classList.remove("d-none");
  
  // Remove active from all sidebar items
  document.querySelectorAll("#sidebar .nav-link").forEach(link => link.classList.remove("active"));
  
  // Highlight current link
  const activeLink = document.querySelector(`#sidebar .nav-link[data-target="${viewId}"]`);
  if (activeLink) {
    activeLink.classList.add("active");
  }
  
  // Update breadcrumb
  let label = "Dashboard";
  if (viewId === "register-view") label = "Register Complaint";
  else if (viewId === "list-view") label = "Complaint List";
  else if (viewId === "reports-view") label = "Reports & Analytics";
  document.getElementById("breadcrumb-current-view").textContent = label;
  
  // Collapse sidebar menu on mobile after navigation
  document.getElementById("sidebar").classList.remove("active");
  
  // Page reset for directory list
  if (viewId === "list-view") {
    state.currentPage = 1;
    applyFiltersAndRenderTable();
  }
  
  // Trigger charts redraw if reports page is visible
  if (viewId === "reports-view") {
    setTimeout(renderCharts, 100);
  }
}

/* ==================== DATA OPERATIONS (API & LOCALSTORAGE) ==================== */

/**
 * Triggers loading/reloading data from source.
 */
function fetchData() {
  const spinner = document.getElementById("sync-spinner");
  const refreshBtn = document.getElementById("refresh-data-btn");
  
  spinner.classList.remove("d-none");
  refreshBtn.setAttribute("disabled", "true");
  
  if (state.isMockMode) {
    // Read from localStorage or create sample data if empty
    let complaintsStr = localStorage.getItem(CONFIG.COMPLAINTS_KEY);
    if (!complaintsStr) {
      state.complaints = getSampleComplaints();
      localStorage.setItem(CONFIG.COMPLAINTS_KEY, JSON.stringify(state.complaints));
    } else {
      state.complaints = JSON.parse(complaintsStr);
    }
    
    // Simulate slight network delay
    setTimeout(() => {
      spinner.classList.add("d-none");
      refreshBtn.removeAttribute("disabled");
      state.filteredComplaints = [...state.complaints];
      updateUI();
      showToast("Data synchronized (Mock Mode).", "success");
    }, 500);
    
  } else {
    // Fetch from Web App API
    fetch(state.apiUrl, {
      method: "GET",
      mode: "cors",
      headers: {
        "Accept": "application/json"
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error("HTTP error " + response.status);
      }
      return response.json();
    })
    .then(res => {
      spinner.classList.add("d-none");
      refreshBtn.removeAttribute("disabled");
      
      if (res.success) {
        state.complaints = res.data;
        state.filteredComplaints = [...state.complaints];
        updateUI();
        showToast("Database synchronized with Google Sheets.", "success");
      } else {
        throw new Error(res.error || "Unknown API response error");
      }
    })
    .catch(err => {
      spinner.classList.add("d-none");
      refreshBtn.removeAttribute("disabled");
      console.error("API error:", err);
      showToast("Failed to connect to Google Sheets. " + err.message, "error");
      
      // Fallback to local storage
      let complaintsStr = localStorage.getItem(CONFIG.COMPLAINTS_KEY);
      state.complaints = complaintsStr ? JSON.parse(complaintsStr) : getSampleComplaints();
      state.filteredComplaints = [...state.complaints];
      updateUI();
    });
  }
}

/**
 * Updates all views with active state data.
 */
function updateUI() {
  calculateAndRenderStats();
  renderRecentComplaintsTable();
  applyFiltersAndRenderTable();
  if (views.reports.classList.contains("d-none") === false) {
    renderCharts();
  }
}

/**
 * Calculate KPI summary statistics
 */
function calculateAndRenderStats() {
  const total = state.complaints.length;
  
  // Format today's date YYYY-MM-DD
  const todayStr = getTodayDateString();
  const todayCount = state.complaints.filter(c => c.date === todayStr).length;
  
  const pendingCount = state.complaints.filter(c => c.status === "Pending" || c.status === "In Progress").length;
  const completedCount = state.complaints.filter(c => c.status === "Completed").length;
  
  const resolutionRate = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  
  // Update elements
  document.querySelectorAll(".count-total").forEach(el => el.textContent = total);
  document.querySelectorAll(".count-today").forEach(el => el.textContent = todayCount);
  document.querySelectorAll(".count-pending").forEach(el => el.textContent = pendingCount);
  document.querySelectorAll(".count-completed").forEach(el => el.textContent = completedCount);
  
  document.getElementById("resolution-rate").textContent = resolutionRate + "%";
  
  const reportRateEl = document.getElementById("resolution-rate-reports");
  if (reportRateEl) reportRateEl.textContent = resolutionRate + "%";
}

/**
 * Renders the dashboard's brief recent complaints table.
 */
function renderRecentComplaintsTable() {
  const tbody = document.getElementById("recent-complaints-tbody");
  tbody.innerHTML = "";
  
  // Top 5 newest
  const recentList = state.complaints.slice(0, 5);
  
  if (recentList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No complaints recorded in database.</td></tr>`;
    return;
  }
  
  recentList.forEach(c => {
    const tr = document.createElement("tr");
    tr.addEventListener("click", () => openEditModal(c.id));
    
    tr.innerHTML = `
      <td class="ps-4 fw-semibold text-primary font-outfit">${escapeHtml(c.id)}</td>
      <td>
        <div class="fw-semibold text-dark">${escapeHtml(c.citizenName)}</div>
        <small class="text-muted font-xs"><i class="fa-solid fa-mobile-screen-button me-1"></i>${escapeHtml(c.mobileNumber)}</small>
      </td>
      <td><span class="small">${escapeHtml(c.department)}</span></td>
      <td><span class="badge-priority ${c.priority.toLowerCase()}">${escapeHtml(c.priority)}</span></td>
      <td><span class="badge-status ${c.status.toLowerCase().replace(" ", "")}">${escapeHtml(c.status)}</span></td>
      <td class="pe-4 text-end">
        <button class="btn btn-light btn-sm text-primary rounded-circle shadow-sm" title="View details">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>
      </td>
    `;
    
    tbody.appendChild(tr);
  });
}

/* ==================== REGISTER COMPLAINT ==================== */

/**
 * Resets intake form fields and pre-fills current date and time.
 */
function resetRegistrationForm() {
  const form = document.getElementById("register-complaint-form");
  form.reset();
  form.classList.remove("was-validated");
  
  // Set current date and time
  const todayStr = getTodayDateString();
  const timeStr = getCurrentTimeString();
  
  document.getElementById("complaint-date").value = todayStr;
  document.getElementById("complaint-time").value = timeStr;
  document.getElementById("complaint-status").value = "Pending";
  document.getElementById("complaint-id-indicator").textContent = "ID: Generated on Save";
}

/**
 * Handles Form Submission
 */
function handleRegisterComplaint(e) {
  e.preventDefault();
  const form = document.getElementById("register-complaint-form");
  
  if (!form.checkValidity()) {
    e.stopPropagation();
    form.classList.add("was-validated");
    return;
  }
  
  const saveBtn = document.getElementById("save-complaint-btn");
  saveBtn.setAttribute("disabled", "true");
  saveBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Saving...`;
  
  // Prepare grievance payload
  const complaintData = {
    date: document.getElementById("complaint-date").value,
    time: document.getElementById("complaint-time").value,
    citizenName: document.getElementById("citizen-name").value.trim(),
    mobileNumber: document.getElementById("mobile-number").value.trim(),
    village: document.getElementById("village").value.trim(),
    taluk: document.getElementById("taluk").value,
    department: document.getElementById("department").value,
    description: document.getElementById("complaint-desc").value.trim(),
    priority: document.getElementById("priority").value,
    status: "Pending", // Default pending for new entries
    remarks: document.getElementById("remarks").value.trim()
  };
  
  if (state.isMockMode) {
    // Generate sequential mock ID
    const mockId = generateMockId(complaintData.date);
    complaintData.id = mockId;
    
    // Add to front of array
    state.complaints.unshift(complaintData);
    localStorage.setItem(CONFIG.COMPLAINTS_KEY, JSON.stringify(state.complaints));
    
    setTimeout(() => {
      saveBtn.removeAttribute("disabled");
      saveBtn.innerHTML = `<i class="fa-regular fa-floppy-disk me-2"></i> Save Grievance`;
      
      showToast(`Complaint registered successfully! ID: ${mockId}`, "success");
      // Trigger modal alert layout success popup
      showSuccessPopup(complaintData);
      
      resetRegistrationForm();
      fetchData();
    }, 600);
    
  } else {
    // Submit to Google Apps Script Web App
    const payload = {
      action: "create",
      data: complaintData
    };
    
    // Send request using simple CORS mode (text/plain body)
    fetch(state.apiUrl, {
      method: "POST",
      mode: "cors",
      body: JSON.stringify(payload)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error("HTTP error " + response.status);
      }
      return response.json();
    })
    .then(res => {
      saveBtn.removeAttribute("disabled");
      saveBtn.innerHTML = `<i class="fa-regular fa-floppy-disk me-2"></i> Save Grievance`;
      
      if (res.success) {
        complaintData.id = res.id;
        showToast(`Complaint saved successfully to Google Sheet! ID: ${res.id}`, "success");
        showSuccessPopup(complaintData);
        resetRegistrationForm();
        fetchData();
      } else {
        throw new Error(res.error || "Save operation failed.");
      }
    })
    .catch(err => {
      saveBtn.removeAttribute("disabled");
      saveBtn.innerHTML = `<i class="fa-regular fa-floppy-disk me-2"></i> Save Grievance`;
      console.error("Save error:", err);
      showToast("Failed to write to Google Sheets. Saving locally as backup.", "error");
      
      // Fallback: Save locally
      const mockId = generateMockId(complaintData.date);
      complaintData.id = mockId;
      state.complaints.unshift(complaintData);
      localStorage.setItem(CONFIG.COMPLAINTS_KEY, JSON.stringify(state.complaints));
      
      showSuccessPopup(complaintData);
      resetRegistrationForm();
      fetchData();
    });
  }
}

/**
 * Shows an styled modal success dialog confirming creation.
 */
function showSuccessPopup(complaint) {
  // Populate the print receipt before printing just in case
  fillPrintReceipt(complaint);
  
  // Create dynamic modal to show success with options to Print or Close
  const modalDiv = document.createElement("div");
  modalDiv.className = "modal fade";
  modalDiv.id = "successPopupModal";
  modalDiv.setAttribute("tabindex", "-1");
  modalDiv.setAttribute("aria-hidden", "true");
  
  modalDiv.innerHTML = `
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content border-0 rounded-4 shadow-lg">
        <div class="modal-body text-center p-5">
          <div class="text-success mb-4" style="font-size: 4rem;">
            <i class="fa-solid fa-circle-check"></i>
          </div>
          <h4 class="fw-bold font-outfit text-dark mb-2">Complaint Registered Successfully</h4>
          <p class="text-muted mb-4">Grievance record has been appended to the database and routed for action.</p>
          
          <div class="bg-light rounded-3 p-3 mb-4 text-start border">
            <div class="row g-2">
              <div class="col-5 text-secondary small fw-semibold">Complaint ID:</div>
              <div class="col-7 fw-bold text-primary font-outfit">${escapeHtml(complaint.id)}</div>
              <div class="col-5 text-secondary small fw-semibold">Citizen Name:</div>
              <div class="col-7 text-dark">${escapeHtml(complaint.citizenName)}</div>
              <div class="col-5 text-secondary small fw-semibold">Mobile:</div>
              <div class="col-7 text-dark">${escapeHtml(complaint.mobileNumber)}</div>
              <div class="col-5 text-secondary small fw-semibold">Assigned Dept:</div>
              <div class="col-7 text-dark fw-semibold">${escapeHtml(complaint.department)}</div>
            </div>
          </div>
          
          <div class="d-grid gap-2 d-sm-flex justify-content-sm-center">
            <button type="button" class="btn btn-outline-primary px-4 py-2 font-outfit" id="success-print-btn">
              <i class="fa-solid fa-print me-1"></i> Print Receipt
            </button>
            <button type="button" class="btn btn-dark px-4 py-2 font-outfit" data-bs-dismiss="modal">
              Close Dialog
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modalDiv);
  
  const bsModal = new bootstrap.Modal(modalDiv);
  
  // Setup print triggers inside success popup
  document.getElementById("success-print-btn").addEventListener("click", () => {
    bsModal.hide();
    setTimeout(() => {
      window.print();
    }, 400);
  });
  
  // Clean up modal from DOM after closure
  modalDiv.addEventListener('hidden.bs.modal', function () {
    modalDiv.remove();
  });
  
  bsModal.show();
}

/**
 * Trigger window print using the currently populated form inputs (Draft)
 */
function printFormDraft() {
  const form = document.getElementById("register-complaint-form");
  const citizenName = document.getElementById("citizen-name").value.trim() || "[Citizen Name]";
  const mobile = document.getElementById("mobile-number").value.trim() || "[Mobile]";
  const taluk = document.getElementById("taluk").value || "[Taluk]";
  const village = document.getElementById("village").value.trim() || "[Village]";
  const department = document.getElementById("department").value || "[Department]";
  const description = document.getElementById("complaint-desc").value.trim() || "[Description]";
  const priority = document.getElementById("priority").value;
  
  const draft = {
    id: "DRAFT-RECEIPT",
    date: document.getElementById("complaint-date").value,
    time: document.getElementById("complaint-time").value,
    citizenName: citizenName,
    mobileNumber: mobile,
    taluk: taluk,
    village: village,
    department: department,
    priority: priority,
    status: "Draft",
    remarks: "This is a draft receipt only. Save form to obtain official complaint registration ID."
  };
  
  fillPrintReceipt(draft);
  window.print();
}

/* ==================== COMPLAINT LIST & SEARCH ==================== */

/**
 * Handle search queries and update view filter
 */
function handleSearch(e) {
  e.preventDefault();
  state.currentPage = 1;
  applyFiltersAndRenderTable();
}

function handleSearchReset() {
  document.getElementById("search-filter-form").reset();
  state.currentPage = 1;
  applyFiltersAndRenderTable();
  showToast("Filters reset.", "info");
}

/**
 * Applies search parameters to state data and renders the results.
 */
function applyFiltersAndRenderTable() {
  const idQuery = document.getElementById("search-id").value.trim().toLowerCase();
  const mobileQuery = document.getElementById("search-mobile").value.trim().toLowerCase();
  const villageQuery = document.getElementById("search-village").value.trim().toLowerCase();
  const deptQuery = document.getElementById("search-department").value;
  const statusQuery = document.getElementById("search-status").value;
  const dateQuery = document.getElementById("search-date").value;
  
  state.filteredComplaints = state.complaints.filter(c => {
    const matchesId = idQuery === "" || c.id.toLowerCase().includes(idQuery);
    const matchesMobile = mobileQuery === "" || c.mobileNumber.toLowerCase().includes(mobileQuery);
    const matchesVillage = villageQuery === "" || c.village.toLowerCase().includes(villageQuery);
    const matchesDept = deptQuery === "" || c.department === deptQuery;
    const matchesStatus = statusQuery === "" || c.status === statusQuery;
    
    // Standardize date matching (Google Sheets stores YYYY-MM-DD)
    const matchesDate = dateQuery === "" || c.date === dateQuery;
    
    return matchesId && matchesMobile && matchesVillage && matchesDept && matchesStatus && matchesDate;
  });
  
  document.getElementById("match-count").textContent = state.filteredComplaints.length;
  renderDirectoryListTable();
}

/**
 * Render the paginated database table.
 */
function renderDirectoryListTable() {
  const tbody = document.getElementById("complaints-list-tbody");
  tbody.innerHTML = "";
  
  const total = state.filteredComplaints.length;
  const startIndex = (state.currentPage - 1) * state.pageSize;
  const endIndex = Math.min(startIndex + state.pageSize, total);
  
  // Slice current page data
  const pageData = state.filteredComplaints.slice(startIndex, endIndex);
  
  if (total === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-5 text-muted"><i class="fa-regular fa-folder-open fs-3 d-block mb-2"></i>No records matching your search queries.</td></tr>`;
    document.getElementById("pagination-start").textContent = "0";
    document.getElementById("pagination-end").textContent = "0";
    document.getElementById("pagination-total").textContent = "0";
    renderPaginationControls(0);
    return;
  }
  
  // Update showing bounds
  document.getElementById("pagination-start").textContent = startIndex + 1;
  document.getElementById("pagination-end").textContent = endIndex;
  document.getElementById("pagination-total").textContent = total;
  
  pageData.forEach(c => {
    const tr = document.createElement("tr");
    
    // format date/time displays
    const dateFormatted = c.date;
    const timeFormatted = c.time;
    
    tr.innerHTML = `
      <td class="ps-4 fw-semibold text-primary font-outfit">${escapeHtml(c.id)}</td>
      <td>
        <div class="fw-semibold small">${escapeHtml(dateFormatted)}</div>
        <small class="text-muted font-xs">${escapeHtml(timeFormatted)}</small>
      </td>
      <td>
        <div class="fw-semibold text-dark">${escapeHtml(c.citizenName)}</div>
        <small class="text-muted font-xs"><i class="fa-solid fa-mobile-screen-button me-1"></i>${escapeHtml(c.mobileNumber)}</small>
      </td>
      <td>
        <div class="small">${escapeHtml(c.village)}</div>
        <small class="text-muted font-xs">${escapeHtml(c.taluk)} Taluk</small>
      </td>
      <td><span class="small">${escapeHtml(c.department)}</span></td>
      <td><span class="badge-priority ${c.priority.toLowerCase()}">${escapeHtml(c.priority)}</span></td>
      <td><span class="badge-status ${c.status.toLowerCase().replace(" ", "")}">${escapeHtml(c.status)}</span></td>
      <td class="pe-4 text-center">
        <button class="btn btn-outline-primary btn-sm rounded-3 px-3 font-outfit" onclick="openEditModal('${c.id}')">
          <i class="fa-solid fa-pen-to-square me-1"></i> Edit / Action
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  
  renderPaginationControls(total);
}

/**
 * Pagination Controls builder
 */
function renderPaginationControls(totalEntries) {
  const ul = document.getElementById("list-pagination");
  ul.innerHTML = "";
  
  const totalPages = Math.ceil(totalEntries / state.pageSize);
  if (totalPages <= 1) return;
  
  // Previous button
  const prevLi = document.createElement("li");
  prevLi.className = `page-item ${state.currentPage === 1 ? 'disabled' : ''}`;
  prevLi.innerHTML = `<a class="page-link" href="#" aria-label="Previous"><span aria-hidden="true">&laquo;</span></a>`;
  prevLi.addEventListener("click", (e) => {
    e.preventDefault();
    if (state.currentPage > 1) {
      state.currentPage--;
      renderDirectoryListTable();
    }
  });
  ul.appendChild(prevLi);
  
  // Page number links
  for (let i = 1; i <= totalPages; i++) {
    const li = document.createElement("li");
    li.className = `page-item ${state.currentPage === i ? 'active' : ''}`;
    li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
    li.addEventListener("click", (e) => {
      e.preventDefault();
      state.currentPage = i;
      renderDirectoryListTable();
    });
    ul.appendChild(li);
  }
  
  // Next button
  const nextLi = document.createElement("li");
  nextLi.className = `page-item ${state.currentPage === totalPages ? 'disabled' : ''}`;
  nextLi.innerHTML = `<a class="page-link" href="#" aria-label="Next"><span aria-hidden="true">&raquo;</span></a>`;
  nextLi.addEventListener("click", (e) => {
    e.preventDefault();
    if (state.currentPage < totalPages) {
      state.currentPage++;
      renderDirectoryListTable();
    }
  });
  ul.appendChild(nextLi);
}

/* ==================== EDIT AND PRINT ACTIONS ==================== */

/**
 * Open detail edit modal
 */
function openEditModal(complaintId) {
  const complaint = state.complaints.find(c => c.id === complaintId);
  if (!complaint) return;
  
  // Populate Modal Fields
  document.getElementById("modal-id").textContent = complaint.id;
  document.getElementById("modal-datetime").textContent = `${complaint.date} at ${complaint.time}`;
  document.getElementById("modal-name").textContent = complaint.citizenName;
  document.getElementById("modal-mobile").textContent = complaint.mobileNumber;
  document.getElementById("modal-location").textContent = `${complaint.village}, ${complaint.taluk} Taluk`;
  document.getElementById("modal-department").textContent = complaint.department;
  document.getElementById("modal-desc").textContent = complaint.description;
  
  document.getElementById("modal-update-priority").value = complaint.priority;
  document.getElementById("modal-update-status").value = complaint.status;
  document.getElementById("modal-update-remarks").value = complaint.remarks || "";
  
  // Toggle overlay loading
  document.getElementById("modal-loading-overlay").classList.add("d-none");
  
  const modalEl = document.getElementById("editComplaintModal");
  const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
  bsModal.show();
}

/**
 * Save edits from update modal to sheets or storage
 */
function handleModalUpdate() {
  const id = document.getElementById("modal-id").textContent;
  const status = document.getElementById("modal-update-status").value;
  const remarks = document.getElementById("modal-update-remarks").value.trim();
  const overlay = document.getElementById("modal-loading-overlay");
  
  overlay.classList.remove("d-none");
  
  const updateData = { status, remarks };
  
  if (state.isMockMode) {
    // Local update
    const idx = state.complaints.findIndex(c => c.id === id);
    if (idx !== -1) {
      state.complaints[idx].status = status;
      state.complaints[idx].remarks = remarks;
      localStorage.setItem(CONFIG.COMPLAINTS_KEY, JSON.stringify(state.complaints));
    }
    
    setTimeout(() => {
      overlay.classList.add("d-none");
      bootstrap.Modal.getOrCreateInstance(document.getElementById("editComplaintModal")).hide();
      showToast(`Complaint ${id} updated successfully!`, "success");
      fetchData();
    }, 500);
    
  } else {
    // Send to Google Sheets API
    const payload = {
      action: "update",
      id: id,
      data: updateData
    };
    
    fetch(state.apiUrl, {
      method: "POST",
      mode: "cors",
      body: JSON.stringify(payload)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error("HTTP error " + response.status);
      }
      return response.json();
    })
    .then(res => {
      overlay.classList.add("d-none");
      
      if (res.success) {
        bootstrap.Modal.getOrCreateInstance(document.getElementById("editComplaintModal")).hide();
        showToast(`Complaint ${id} successfully updated on Google Sheet!`, "success");
        fetchData();
      } else {
        throw new Error(res.error || "Update operation failed.");
      }
    })
    .catch(err => {
      overlay.classList.add("d-none");
      console.error("Update error:", err);
      showToast("API error updating. Saving backup locally.", "error");
      
      // Fallback
      const idx = state.complaints.findIndex(c => c.id === id);
      if (idx !== -1) {
        state.complaints[idx].status = status;
        state.complaints[idx].remarks = remarks;
        localStorage.setItem(CONFIG.COMPLAINTS_KEY, JSON.stringify(state.complaints));
      }
      
      bootstrap.Modal.getOrCreateInstance(document.getElementById("editComplaintModal")).hide();
      fetchData();
    });
  }
}

/**
 * Fills print receipt template with complaint details.
 */
function fillPrintReceipt(complaint) {
  document.getElementById("print-receipt-id").textContent = complaint.id;
  document.getElementById("print-receipt-priority").textContent = complaint.priority;
  document.getElementById("print-receipt-date").textContent = complaint.date;
  document.getElementById("print-receipt-time").textContent = complaint.time;
  document.getElementById("print-receipt-name").textContent = complaint.citizenName;
  document.getElementById("print-receipt-mobile").textContent = complaint.mobileNumber;
  document.getElementById("print-receipt-taluk").textContent = complaint.taluk;
  document.getElementById("print-receipt-village").textContent = complaint.village;
  document.getElementById("print-receipt-department").textContent = complaint.department;
  document.getElementById("print-receipt-status").textContent = complaint.status;
  document.getElementById("print-receipt-desc").textContent = complaint.description;
  
  const remarksDiv = document.getElementById("print-receipt-remarks-div");
  if (complaint.remarks) {
    remarksDiv.classList.remove("d-none");
    document.getElementById("print-receipt-remarks").textContent = complaint.remarks;
  } else {
    remarksDiv.classList.add("d-none");
  }
  
  // Set current print system stamp
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) + " " + 
                  now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12:true });
  document.querySelectorAll(".print-timestamp").forEach(el => el.textContent = dateStr);
}

/**
 * Prepares and triggers printing receipt of specific complaint ID.
 */
function printComplaintReceipt(id) {
  const complaint = state.complaints.find(c => c.id === id);
  if (!complaint) return;
  
  // Populate
  fillPrintReceipt(complaint);
  
  // Trigger system print dialogue
  // Bootstrap modal needs to be hidden, or it blocks layouts
  const modalEl = document.getElementById("editComplaintModal");
  const bsModal = bootstrap.Modal.getInstance(modalEl);
  
  if (bsModal) {
    bsModal.hide();
    // Allow animation delay before printing to avoid glitchy rendering
    setTimeout(() => {
      window.print();
    }, 400);
  } else {
    window.print();
  }
}

/* ==================== ANALYTICS & CHARTS (CHART.JS) ==================== */

/**
 * Render/re-render all dashboards stats graphs.
 */
function renderCharts() {
  const canvasStatus = document.getElementById("statusChart");
  const canvasPriority = document.getElementById("priorityChart");
  const canvasDept = document.getElementById("departmentChart");
  
  if (!canvasStatus || !canvasPriority || !canvasDept) return;
  
  // Reset/Destroy old charts to prevent duplicate draw hover bugs
  if (state.charts.status) state.charts.status.destroy();
  if (state.charts.priority) state.charts.priority.destroy();
  if (state.charts.department) state.charts.department.destroy();
  
  const data = state.complaints;
  
  // 1. Status count
  const statusCounts = { Pending: 0, "In Progress": 0, Completed: 0 };
  data.forEach(c => {
    if (statusCounts[c.status] !== undefined) {
      statusCounts[c.status]++;
    } else {
      // Handle fallback values if status isn't matched
      statusCounts.Pending++;
    }
  });
  
  // 2. Priority count
  const priorityCounts = { Low: 0, Medium: 0, High: 0 };
  data.forEach(c => {
    if (priorityCounts[c.priority] !== undefined) {
      priorityCounts[c.priority]++;
    } else {
      priorityCounts.Medium++;
    }
  });
  
  // 3. Department count
  const deptCounts = {};
  data.forEach(c => {
    deptCounts[c.department] = (deptCounts[c.department] || 0) + 1;
  });
  // Sort departments by highest
  const sortedDepts = Object.entries(deptCounts)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 7); // Limit to top 7 for cleaner UI
  
  const deptLabels = sortedDepts.map(d => d[0]);
  const deptData = sortedDepts.map(d => d[1]);
  
  // Status Chart (Doughnut)
  state.charts.status = new Chart(canvasStatus, {
    type: 'doughnut',
    data: {
      labels: ['Pending', 'In Progress', 'Completed'],
      datasets: [{
        data: [statusCounts.Pending, statusCounts["In Progress"], statusCounts.Completed],
        backgroundColor: ['#f59e0b', '#0d9488', '#10b981'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { boxWidth: 12, font: { family: 'Inter', size: 10 } }
        }
      },
      cutout: '70%'
    }
  });
  
  // Priority Chart (Pie)
  state.charts.priority = new Chart(canvasPriority, {
    type: 'pie',
    data: {
      labels: ['Low', 'Medium', 'High'],
      datasets: [{
        data: [priorityCounts.Low, priorityCounts.Medium, priorityCounts.High],
        backgroundColor: ['#3b82f6', '#f59e0b', '#ef4444'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { boxWidth: 12, font: { family: 'Inter', size: 10 } }
        }
      }
    }
  });
  
  // Department Chart (Horizontal Bar)
  state.charts.department = new Chart(canvasDept, {
    type: 'bar',
    data: {
      labels: deptLabels.length > 0 ? deptLabels : ["No Data"],
      datasets: [{
        label: 'Complaints',
        data: deptData.length > 0 ? deptData : [0],
        backgroundColor: '#0a369d',
        borderRadius: 5,
        barThickness: 15
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { stepSize: 1, font: { family: 'Inter' } },
          grid: { color: '#f1f5f9' }
        },
        y: {
          grid: { display: false },
          ticks: { font: { family: 'Inter', size: 10 } }
        }
      }
    }
  });
}

/* ==================== UTILITIES & HELPERS ==================== */

function resetDemoData() {
  if (!window.confirm("Reset the portal to the default sample complaints?")) {
    return;
  }

  const sampleComplaints = getSampleComplaints();
  state.complaints = sampleComplaints;
  state.filteredComplaints = [...sampleComplaints];
  localStorage.setItem(CONFIG.COMPLAINTS_KEY, JSON.stringify(sampleComplaints));
  updateUI();
  showToast("Demo complaint data restored successfully.", "success");
}

/**
 * Toast Pop-ups
 */
function showToast(message, type = "info") {
  const toastEl = document.getElementById("system-toast");
  const iconEl = document.getElementById("toast-icon");
  const msgEl = document.getElementById("toast-message");
  
  // Remove past classes
  toastEl.classList.remove("success", "error", "info");
  
  // Add design attributes
  toastEl.classList.add(type);
  msgEl.textContent = message;
  
  // Set Icon
  if (type === "success") {
    iconEl.className = "fa-solid fa-circle-check";
    toastEl.style.backgroundColor = "var(--status-completed)";
  } else if (type === "error") {
    iconEl.className = "fa-solid fa-circle-xmark";
    toastEl.style.backgroundColor = "var(--priority-high)";
  } else {
    iconEl.className = "fa-solid fa-circle-info";
    toastEl.style.backgroundColor = "var(--primary-color)";
  }
  
  const bsToast = new bootstrap.Toast(toastEl, { delay: 4000 });
  bsToast.show();
}

/**
 * Generates mock ID formatted as RMD-YYYYMMDD-XXXX matching the Sheet logic.
 */
function generateMockId(dateStr) {
  const cleanDate = dateStr.replace(/-/g, ""); // YYYYMMDD
  const prefix = "RMD-" + cleanDate + "-";
  
  let maxNum = 0;
  state.complaints.forEach(c => {
    if (c.id && c.id.indexOf(prefix) === 0) {
      const numPart = c.id.substring(prefix.length);
      const num = parseInt(numPart, 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  });
  
  const nextNum = maxNum + 1;
  const nextNumStr = ("0000" + nextNum).slice(-4);
  return prefix + nextNumStr;
}

/**
 * Helper: date format formatting string YYYY-MM-DD
 */
function getTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = ("0" + (today.getMonth() + 1)).slice(-2);
  const day = ("0" + today.getDate()).slice(-2);
  return `${year}-${month}-${day}`;
}

/**
 * Helper: time format formatting string HH:MM
 */
function getCurrentTimeString() {
  const today = new Date();
  const hours = ("0" + today.getHours()).slice(-2);
  const minutes = ("0" + today.getMinutes()).slice(-2);
  return `${hours}:${minutes}`;
}

/**
 * Simple HTML Escaper for security sanitization
 */
function escapeHtml(text) {
  if (text === null || text === undefined) return "";
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.toString().replace(/[&<>"']/g, function(m) { return map[m]; });
}

/**
 * Realistic dummy grievances to populate local storage mock database.
 */
function getSampleComplaints() {
  return [
    {
      id: "RMD-20260704-0001",
      date: "2026-07-04",
      time: "09:30",
      citizenName: "Muthu Krishnan",
      mobileNumber: "9845612301",
      village: "Pamban Jetty Road",
      taluk: "Rameswaram",
      department: "Electricity (TANGEDCO)",
      description: "Frequent power outages in our street for the past three days. Substation reports load shedding but other areas have power. Street lights are also out.",
      priority: "High",
      status: "Pending",
      remarks: ""
    },
    {
      id: "RMD-20260704-0002",
      date: "2026-07-04",
      time: "08:15",
      citizenName: "Selvi R",
      mobileNumber: "9442318950",
      village: "Valantharavai Village",
      taluk: "Ramanathapuram",
      department: "Water Supply (TWAD / Panchayats)",
      description: "Drinking water supply not provided for the last two weeks. Main valve pipeline blocked near railway track. Requests pipeline flush.",
      priority: "High",
      status: "In Progress",
      remarks: "Field engineer inspected. Block identified. Replacement materials ordered."
    },
    {
      id: "RMD-20260703-0002",
      date: "2026-07-03",
      time: "16:45",
      citizenName: "Abdul Rahman",
      mobileNumber: "9786012345",
      village: "Ervadi Dargah Street",
      taluk: "Kilakarai",
      department: "Revenue",
      description: "Application for patta transfer pending at Revenue inspector office for over a month. Need status update. Reference No: REV-98213.",
      priority: "Medium",
      status: "Completed",
      remarks: "Verified documents. Patta transfer approved and certificate dispatched to citizen."
    },
    {
      id: "RMD-20260703-0001",
      date: "2026-07-03",
      time: "11:20",
      citizenName: "Murugesan K",
      mobileNumber: "8122340567",
      village: "Sathirakudi Main Bazaar",
      taluk: "Paramakudi",
      department: "Panchayats (Rural Development)",
      description: "Street lights are not functioning in Ambedkar Nagar street near government school. Creating safety issues in evening hours.",
      priority: "Low",
      status: "Completed",
      remarks: "5 sodium vapor bulbs replaced on 03-Jul evening. Resolved."
    },
    {
      id: "RMD-20260702-0001",
      date: "2026-07-02",
      time: "14:10",
      citizenName: "Kavitha M",
      mobileNumber: "9080706050",
      village: "Sayalgudi bus stand",
      taluk: "Kadaladi",
      department: "Police",
      description: "Nuisance by street vendors blocking shop entrance near local market. Causing heavy traffic congestion.",
      priority: "Low",
      status: "In Progress",
      remarks: "Beat officers notified. Encroachment cleared partially. Monitoring daily."
    }
  ];
}
