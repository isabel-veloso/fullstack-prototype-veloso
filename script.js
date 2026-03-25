// ==========================================
// Phase 2: Core Routing & Auth Variables
// ==========================================
let currentUser = null;
const STORAGE_KEY = 'ipt_demo_v1';

/**
 * navigateTo(hash): Requirement - Updates window.location.hash 
 */
function navigateTo(hash) {
    window.location.hash = hash;
}

// ==========================================
// Phase 4: Data Persistence (Local Storage)
// ==========================================

/**
 * loadFromStorage(): Parses localStorage and seeds initial data if missing 
 */
function loadFromStorage() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        window.db = JSON.parse(data);
    } else {
        // Seeds with initial data 
        window.db = {
            accounts: [
                { id: 1, firstName: 'Admin', lastName: 'User', email: 'admin@example.com', password: 'Password123!', role: 'admin', verified: true }
            ],
            employees: [],
            departments: [
                { name: 'Engineering', desc: 'Software team' },
                { name: 'HR', desc: 'Human Resources' }
            ],
            requests: []
        };
        saveToStorage();
    }
}

function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db)); 
}

// ==========================================
// Phase 2 & 3: Routing & Auth State Management
// ==========================================

function handleRouting() {
    const hash = window.location.hash || '#/'; 
    
    if (hash === '#/logout') {
        handleLogout();
        return;
    }

    // Reverse Bouncer: Redirect away from login/register if already authenticated 
    if (currentUser && (hash === '#/login' || hash === '#/register')) {
        navigateTo('#/profile');
        return;
    }

    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.remove('active')); 

    const routeMap = {
        '#/': 'home-page',
        '#/login': 'login-page',
        '#/register': 'register-page',
        '#/verify-email': 'verify-email-page',
        '#/profile': 'profile-page',
        '#/employees': 'employees-page',
        '#/accounts': 'accounts-page',
        '#/departments': 'departments-page',
        '#/requests': 'requests-page',
    };

    const targetId = routeMap[hash] || 'home-page';
    const targetElement = document.getElementById(targetId);

    const adminPages = ['#/employees', '#/accounts', '#/departments'];
    const userPages = ['#/profile', '#/requests'];
    
    if (targetElement) {
        // Protection Logic 
        if (userPages.includes(hash) && !currentUser) {
            navigateTo('#/login');
            return;
        }
        
        if (adminPages.includes(hash) && (!currentUser || currentUser.role !== 'admin')) {
            navigateTo('#/');
            return;
        }

        targetElement.classList.add('active'); 

        // Trigger Renderers 
        if (hash === '#/profile') renderProfile();
        if (hash === '#/accounts') renderAccountsList(); 
        if (hash === '#/departments') renderDepartments();
        if (hash === '#/employees') renderEmployeesTable(); 
        if (hash === '#/requests' || hash === '#/admin-requests') {
            renderRequests();
        }
    }
}

function setAuthState(isAuth, user = null) {
    const body = document.body;
    const navName = document.getElementById('nav-user-name'); 
    
    currentUser = user; 
    if (isAuth && user) {
        body.classList.replace('not-authenticated', 'authenticated'); 
        if (user.role === 'admin') body.classList.add('is-admin'); 
        if (navName) navName.innerText = user.role === 'admin' ? "Admin" : user.firstName; 
    } else {
        body.classList.replace('authenticated', 'not-authenticated'); 
        body.classList.remove('is-admin');
        if (navName) navName.innerText = "User";
        currentUser = null;
    }
}

function handleLogout() {
    localStorage.removeItem('auth_token'); 
    setAuthState(false); 
    showToast("Logged out successfully", "info");
    navigateTo('#/'); 
}

// ==========================================
// Phase 3: Registration & Login Logic
// ==========================================

const regForm = document.getElementById('register-form');
if (regForm) {
    regForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('reg-email').value;
        if (window.db.accounts.find(a => a.email === email)) {
            return showToast("Email already exists!", "danger");
        }
        window.db.accounts.push({ 
            id: Date.now(),
            firstName: document.getElementById('reg-firstname').value,
            lastName: document.getElementById('reg-lastname').value,
            email: email,
            password: document.getElementById('reg-password').value,
            role: 'user', 
            verified: false 
        });
        saveToStorage();
        localStorage.setItem('unverified_email', email); 
        navigateTo('#/verify-email'); 
    });
}

function simulateVerification() {
    const email = localStorage.getItem('unverified_email'); 
    const account = window.db.accounts.find(a => a.email === email);
    if (account) {
        account.verified = true; 
        saveToStorage(); 
        showToast("Email verified!", "success");
        navigateTo('#/login'); 
    }
}

const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('login-email').value;
        const passwordInput = document.getElementById('login-password').value;

        // Find matching verified account 
        const user = window.db.accounts.find(u => 
            u.email === emailInput && 
            u.password === passwordInput && 
            u.verified === true
        );

        if (user) {
            localStorage.setItem('auth_token', user.email);
            setAuthState(true, user); 
            showToast(`Hello, ${user.firstName}!`, "success");
            setTimeout(() => { navigateTo('#/profile'); }, 150); 
        } else {
            showToast("Invalid credentials or unverified email.", "danger"); 
        }
    });
}

// ==========================================
// Phase 6: Admin Management (CRUD)
// ==========================================

// --- Accounts (Phase 6A) ---
function renderAccountsList() { // Renamed per guide 
    const tbody = document.getElementById('accounts-table-body');
    if (!tbody) return;
    tbody.innerHTML = window.db.accounts.map(acc => `
        <tr>
            <td>${acc.firstName} ${acc.lastName}</td>
            <td>${acc.email}</td>
            <td><span class="badge bg-info">${acc.role}</span></td>
            <td>${acc.verified ? '✅' : '❌'}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editAccount(${acc.id})">Edit</button>
                <button class="btn btn-sm btn-outline-warning me-1" onclick="resetPassword(${acc.id})">Reset PW</button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteAccount(${acc.id})">Delete</button>
            </td>
        </tr>`).join(''); 
}

function toggleAccountForm() { 
    const container = document.getElementById('account-form-container');
    container.classList.toggle('d-none');
    if (container.classList.contains('d-none')) {
        document.getElementById('account-form').reset();
        delete document.getElementById('account-form').dataset.editingId;
    }
}

function editAccount(id) { 
    const acc = window.db.accounts.find(a => a.id === id);
    if (!acc) return;
    document.getElementById('acc-firstname').value = acc.firstName;
    document.getElementById('acc-lastname').value = acc.lastName;
    document.getElementById('acc-email').value = acc.email;
    document.getElementById('acc-role').value = acc.role;
    document.getElementById('acc-verified').checked = acc.verified;
    document.getElementById('account-form').dataset.editingId = id;
    if (document.getElementById('account-form-container').classList.contains('d-none')) toggleAccountForm();
}

function resetPassword(id) {
    if (currentUser && id === currentUser.id) return showToast("Cannot reset own password here.", "info");
    const newPassword = prompt("Enter new password (min 6 characters):"); // 
    if (newPassword && newPassword.length >= 6) { // Requirement: min 6 chars 
        const acc = window.db.accounts.find(a => a.id === id);
        if (acc) {
            acc.password = newPassword;
            saveToStorage();
            showToast("Password updated!", "success");
        }
    } else if (newPassword !== null) {
        showToast("Error: Minimum 6 characters required.", "danger");
    }
}

function deleteAccount(id) {
    if (currentUser && id === currentUser.id) return showToast("Cannot delete yourself!", "danger"); 
    if (confirm("Delete this account?")) { 
        window.db.accounts = window.db.accounts.filter(a => a.id !== id);
        saveToStorage();
        renderAccountsList();
        showToast("Account removed", "info");
    }
}

const accForm = document.getElementById('account-form');
if (accForm) {
    accForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const editingId = e.target.dataset.editingId;
        const email = document.getElementById('acc-email').value;

        const accountData = {
            firstName: document.getElementById('acc-firstname').value,
            lastName: document.getElementById('acc-lastname').value,
            email: email,
            role: document.getElementById('acc-role').value,
            verified: document.getElementById('acc-verified').checked,
            password: document.getElementById('acc-password').value || "Password123!"
        };

        if (editingId) {
            const index = window.db.accounts.findIndex(a => a.id == editingId);
            window.db.accounts[index] = { ...window.db.accounts[index], ...accountData };
            showToast("Account updated!", "success");
        } else {
            if (window.db.accounts.find(a => a.email === email)) return showToast("Email exists!", "danger");
            window.db.accounts.push({ id: Date.now(), ...accountData });
            showToast("Account created!", "success");
        }
        saveToStorage();
        renderAccountsList();
        toggleAccountForm();
    });
}

// --- Departments (Phase 6B) ---
function toggleDeptForm() {
    const container = document.getElementById('dept-form-container');
    container.classList.toggle('d-none');
    if (container.classList.contains('d-none')) {
        document.getElementById('dept-form').reset();
        delete document.getElementById('dept-form').dataset.editIndex;
    }
}

function renderDepartments() {
    const tableBody = document.getElementById('dept-list-body');
    if (!tableBody) return;
    tableBody.innerHTML = window.db.departments.map((dept, index) => `
        <tr>
            <td>${dept.name}</td>
            <td>${dept.desc}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editDepartment(${index})">Edit</button>
                <button class="btn btn-sm btn-outline-danger" onclick="removeDepartment(${index})">Delete</button>
            </td>
        </tr>`).join(''); 
}

function removeDepartment(index) {
    if (confirm("Remove department?")) {
        window.db.departments.splice(index, 1);
        saveToStorage();
        renderDepartments();
        showToast("Department removed", "info");
    }
}

function editDepartment(index) {
    const dept = window.db.departments[index];
    document.getElementById('new-dept-name').value = dept.name;
    document.getElementById('new-dept-desc').value = dept.desc;
    document.getElementById('dept-form').dataset.editIndex = index;
    if (document.getElementById('dept-form-container').classList.contains('d-none')) toggleDeptForm();
}

const dForm = document.getElementById('dept-form');
if (dForm) {
    dForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('new-dept-name').value;
        const desc = document.getElementById('new-dept-desc').value;
        const editIndex = e.target.dataset.editIndex;

        if (editIndex !== undefined) {
            window.db.departments[editIndex] = { name, desc };
            showToast("Department updated!", "success");
        } else {
            window.db.departments.push({ name, desc });
            showToast("Department added!", "success");
        }
        saveToStorage();
        renderDepartments();
        toggleDeptForm();
    });
}

// --- Employees (Phase 6C) ---
function renderEmployeesTable() { // Renamed per guide 
    const tbody = document.getElementById('employees-table-body');
    if (!tbody) return;
    if (window.db.employees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-3">No employees.</td></tr>'; 
        return;
    }
    tbody.innerHTML = window.db.employees.map(emp => `
        <tr>
            <td>${emp.id}</td>
            <td>${emp.email}</td>
            <td>${emp.position}</td>
            <td><span class="badge bg-secondary">${emp.dept}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editEmployee('${emp.id}')">Edit</button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteEmployee('${emp.id}')">Remove</button>
            </td>
        </tr>`).join(''); 
}

function toggleEmployeeForm() { 
    const container = document.getElementById('employee-form-container');
    container.classList.toggle('d-none');
    if (!container.classList.contains('d-none')) {
        document.getElementById('emp-dept').innerHTML = window.db.departments.map(d => `<option value="${d.name}">${d.name}</option>`).join(''); 
    } else {
        document.getElementById('employee-form').reset();
        delete document.getElementById('employee-form').dataset.editId;
    }
}

function editEmployee(id) {
    const emp = window.db.employees.find(e => e.id === id);
    document.getElementById('emp-id').value = emp.id;
    document.getElementById('emp-email').value = emp.email;
    document.getElementById('emp-position').value = emp.position;
    document.getElementById('emp-hire-date').value = emp.hireDate;
    document.getElementById('employee-form').dataset.editId = id;
    if (document.getElementById('employee-form-container').classList.contains('d-none')) toggleEmployeeForm();
    document.getElementById('emp-dept').value = emp.dept;
}

function deleteEmployee(id) {
    if (confirm("Remove employee record?")) {
        window.db.employees = window.db.employees.filter(e => e.id !== id);
        saveToStorage();
        renderEmployeesTable();
        showToast("Employee removed", "info");
    }
}

const eForm = document.getElementById('employee-form');
if (eForm) {
    eForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('emp-email').value;
        if (!window.db.accounts.find(a => a.email === email)) return showToast("Error: Account email not found!", "danger"); 

        const empData = {
            id: document.getElementById('emp-id').value,
            email: email,
            position: document.getElementById('emp-position').value,
            dept: document.getElementById('emp-dept').value,
            hireDate: document.getElementById('emp-hire-date').value
        };

        const editId = e.target.dataset.editId;
        if (editId) {
            const idx = window.db.employees.findIndex(em => em.id === editId);
            window.db.employees[idx] = empData;
            showToast("Employee updated!", "success");
        } else {
            window.db.employees.push(empData);
            showToast("Employee created!", "success");
        }
        saveToStorage();
        renderEmployeesTable();
        toggleEmployeeForm();
    });
}

function renderAdminRequests() {
    const tbody = document.getElementById('admin-requests-table-body');
    if (!tbody) return;

    if (window.db.requests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-3">No requests found.</td></tr>';
        return;
    }

    tbody.innerHTML = window.db.requests.map(req => {
        const items = req.items.map(i => `${i.name} (${i.qty})`).join(', ');
        const isPending = req.status === 'Pending';
        
        return `
            <tr>
                <td>${req.employeeEmail}</td>
                <td>${req.date}</td>
                <td>${req.type}</td>
                <td><small>${items}</small></td>
                <td><span class="badge ${getStatusBadge(req.status)}">${req.status}</span></td>
                <td>
                    ${isPending ? `
                        <button class="btn btn-sm btn-success me-1" onclick="updateRequestStatus(${req.id}, 'Approved')">Approve</button>
                        <button class="btn btn-sm btn-danger" onclick="updateRequestStatus(${req.id}, 'Rejected')">Reject</button>
                    ` : '<span class="text-muted small">Processed</span>'}
                </td>
            </tr>`;
    }).join('');
}

/**
 * updateRequestStatus(): Changes status and saves to storage
 */
function updateRequestStatus(requestId, newStatus) {
    const request = window.db.requests.find(r => r.id === requestId);
    if (request) {
        request.status = newStatus;
        saveToStorage();
        renderAdminRequests(); // Refresh the table
        showToast(`Request ${newStatus}!`, newStatus === 'Approved' ? "success" : "danger");
    }
}

// Helper to get badge colors
function getStatusBadge(status) {
    if (status === 'Approved') return 'bg-success';
    if (status === 'Rejected') return 'bg-danger';
    return 'bg-warning text-dark';
}


// ==========================================
// Phase 5 & 7: User Content
// ==========================================

function renderProfile() { 
    const container = document.getElementById('profile-page');
    if (!currentUser) return;
    container.innerHTML = `
        <h3>My Profile</h3>
        <div class="card shadow-sm" style="max-width: 500px;">
            <div class="card-body">
                <h5 class="card-title fw-bold">${currentUser.firstName} ${currentUser.lastName}</h5>
                <p><strong>Email:</strong> ${currentUser.email}<br>
                <strong>Role:</strong> ${currentUser.role}</p>
                <button class="btn btn-outline-primary btn-sm" onclick="showToast('Feature not implemented yet', 'info')">Edit Profile</button>
            </div>
        </div>`; 
}

function renderRequests() {
    const title = document.getElementById('requests-page-title');
    const tableHeader = document.getElementById('requests-table-header');
    const tableBody = document.getElementById('requests-table-body');
    const btnNew = document.getElementById('btn-new-request');
    const container = document.getElementById('requests-table-container');
    const emptyView = document.getElementById('empty-requests-view');

    if (!currentUser || !tableBody) return;

    const isAdmin = currentUser.role === 'admin';
    
    // 1. Setup UI elements based on role
    title.innerText = isAdmin ? "Manage User Requests" : "My Requests";
    btnNew.style.display = isAdmin ? "none" : "block"; // Admin doesn't create requests here

    // 2. Define Table Headers
    tableHeader.innerHTML = `
        ${isAdmin ? '<th>User</th>' : ''}
        <th>Date</th>
        <th>Type</th>
        <th>Items</th>
        <th>Status</th>
        ${isAdmin ? '<th>Actions</th>' : ''}
    `;

    // 3. Filter Data: Admin sees all, User sees only theirs
    const displayData = isAdmin 
        ? window.db.requests 
        : window.db.requests.filter(r => r.employeeEmail === currentUser.email);

    // 4. Handle Empty State
    if (displayData.length === 0) {
        container.style.display = 'none';
        emptyView.style.display = 'block';
        return;
    }

    container.style.display = 'block';
    emptyView.style.display = 'none';

    // 5. Render Rows
    tableBody.innerHTML = displayData.map(req => {
        const items = req.items.map(i => `${i.name} (${i.qty})`).join(', ');
        const badge = getStatusBadge(req.status);
        
        return `
            <tr>
                ${isAdmin ? `<td><strong>${req.employeeEmail}</strong></td>` : ''}
                <td>${req.date}</td>
                <td>${req.type}</td>
                <td><small>${items}</small></td>
                <td><span class="badge ${badge}">${req.status}</span></td>
                ${isAdmin ? `
                    <td>
                        ${req.status === 'Pending' ? `
                            <button class="btn btn-sm btn-success" onclick="updateRequestStatus(${req.id}, 'Approved')">Approve</button>
                            <button class="btn btn-sm btn-danger" onclick="updateRequestStatus(${req.id}, 'Rejected')">Reject</button>
                        ` : '<span class="text-muted small">Finalized</span>'}
                    </td>
                ` : ''}
            </tr>`;
    }).join('');
}

// Logic to update status
function updateRequestStatus(id, newStatus) {
    const req = window.db.requests.find(r => r.id === id);
    if (req) {
        req.status = newStatus;
        saveToStorage();
        renderRequests(); // Re-render the same page
        showToast(`Request ${newStatus}`, "info");
    }
}

// Helper for colors
function getStatusBadge(status) {
    if (status === 'Approved') return 'bg-success';
    if (status === 'Rejected') return 'bg-danger';
    return 'bg-warning text-dark';
}

// Requisition Builder logic
document.addEventListener('click', (e) => {
    const container = document.getElementById('dynamic-items-container');
    if (!container) return;
    if (e.target.classList.contains('add-item-btn')) { 
        e.preventDefault();
        const newRow = document.createElement('div');
        newRow.className = 'input-group mb-2 item-row';
        newRow.innerHTML = `<input type="text" class="form-control item-name" placeholder="Item name" required>
            <input type="number" class="form-control item-qty text-center" value="1" style="max-width: 60px;" required>
            <button type="button" class="btn btn-outline-danger remove-item-btn">×</button>`;
        container.appendChild(newRow);
    }
    if (e.target.classList.contains('remove-item-btn')) e.target.closest('.item-row').remove(); 
});

const rForm = document.getElementById('new-request-form');
if (rForm) {
    rForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const items = Array.from(document.querySelectorAll('.item-row')).map(row => ({
            name: row.querySelector('.item-name').value,
            qty: row.querySelector('.item-qty').value
        }));
        
        if (items.length === 0) return showToast("Add at least one item!", "danger"); 

        window.db.requests.push({ 
            id: Date.now(),
            date: new Date().toLocaleDateString(),
            type: document.getElementById('req-type').value,
            items: items,
            status: 'Pending',
            employeeEmail: currentUser.email
        });
        saveToStorage(); 
        bootstrap.Modal.getInstance(document.getElementById('requestModal')).hide();
        e.target.reset();
        renderRequests();
        showToast("Request submitted!", "success");
    });
}

// ==========================================
// Phase 8: Notifications & Init
// ==========================================

function showToast(message, type = 'info') { 
    const toastEl = document.getElementById('liveToast');
    const toastStyling = document.getElementById('toast-styling');
    if (!toastEl) return;
    const colors = { success: { bg: 'bg-success', text: 'text-white', icon: '✅' }, danger: { bg: 'bg-danger', text: 'text-white', icon: '❌' }, info: { bg: 'bg-info', text: 'text-dark', icon: '⚠️' } };
    const config = colors[type] || colors.info;
    toastStyling.className = `d-flex align-items-center p-1 rounded ${config.bg} ${config.text}`;
    document.getElementById('toast-message').innerText = message;
    document.getElementById('toast-icon').innerText = config.icon;
    new bootstrap.Toast(toastEl, { delay: 3000 }).show();
}

function initApp() {
    loadFromStorage(); 
    const token = localStorage.getItem('auth_token');
    if (token) {
        const user = window.db.accounts.find(u => u.email === token);
        if (user && user.verified) setAuthState(true, user);
    }
    handleRouting();
}

window.addEventListener('hashchange', handleRouting); 
initApp();