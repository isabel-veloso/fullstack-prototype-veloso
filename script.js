// ==========================================
// Phase 2: Core Routing & Auth Variables
// ==========================================
let currentUser = null;
const STORAGE_KEY = 'ipt_demo_v1'; // [cite: 598]

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
 * loadFromStorage(): Parses localStorage and seeds initial data if missing [cite: 599, 601]
 */
function loadFromStorage() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        window.db = JSON.parse(data);
    } else {
        // Seeds with initial data [cite: 602, 603]
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db)); // [cite: 604]
}

// ==========================================
// Phase 2 & 3: Routing & Auth State Management
// ==========================================

function handleRouting() {
    const hash = window.location.hash || '#/'; // [cite: 555]
    
    if (hash === '#/logout') {
        handleLogout();
        return;
    }

    // Reverse Bouncer: Redirect away from login/register if already authenticated [cite: 558]
    if (currentUser && (hash === '#/login' || hash === '#/register')) {
        navigateTo('#/profile');
        return;
    }

    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.remove('active')); // [cite: 556]

    const routeMap = {
        '#/': 'home-page',
        '#/login': 'login-page',
        '#/register': 'register-page',
        '#/verify-email': 'verify-email-page',
        '#/profile': 'profile-page',
        '#/employees': 'employees-page',
        '#/accounts': 'accounts-page',
        '#/departments': 'departments-page',
        '#/requests': 'requests-page'
    };

    const targetId = routeMap[hash] || 'home-page';
    const targetElement = document.getElementById(targetId);
    
    if (targetElement) {
        // Protection Logic [cite: 558, 559]
        const adminPages = ['#/employees', '#/accounts', '#/departments'];
        const userPages = ['#/profile', '#/requests'];

        if (userPages.includes(hash) && !currentUser) {
            navigateTo('#/login');
            return;
        }
        
        if (adminPages.includes(hash) && (!currentUser || currentUser.role !== 'admin')) {
            navigateTo('#/');
            return;
        }

        targetElement.classList.add('active'); // [cite: 557]

        // Trigger Renderers [cite: 612, 634]
        if (hash === '#/profile') renderProfile();
        if (hash === '#/accounts') renderAccountsList(); 
        if (hash === '#/departments') renderDepartments();
        if (hash === '#/employees') renderEmployeesTable(); 
        if (hash === '#/requests') renderRequests(); 
    }
}

function setAuthState(isAuth, user = null) {
    const body = document.body;
    const navName = document.getElementById('nav-user-name'); 
    
    currentUser = user; // [cite: 589]
    if (isAuth && user) {
        body.classList.replace('not-authenticated', 'authenticated'); // [cite: 590]
        if (user.role === 'admin') body.classList.add('is-admin'); // [cite: 591]
        if (navName) navName.innerText = user.role === 'admin' ? "Admin" : user.firstName; 
    } else {
        body.classList.replace('authenticated', 'not-authenticated'); // [cite: 590]
        body.classList.remove('is-admin');
        if (navName) navName.innerText = "User";
        currentUser = null;
    }
}

function handleLogout() {
    localStorage.removeItem('auth_token'); // [cite: 593]
    setAuthState(false); // [cite: 594]
    showToast("Logged out successfully", "info");
    navigateTo('#/'); // [cite: 595]
}

// ==========================================
// Phase 3: Registration & Login Logic
// ==========================================

const regForm = document.getElementById('register-form');
if (regForm) {
    regForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('reg-email').value;
        if (window.db.accounts.find(a => a.email === email)) { // [cite: 568]
            return showToast("Email already exists!", "danger");
        }
        window.db.accounts.push({ // [cite: 569]
            id: Date.now(),
            firstName: document.getElementById('reg-firstname').value,
            lastName: document.getElementById('reg-lastname').value,
            email: email,
            password: document.getElementById('reg-password').value,
            role: 'user', 
            verified: false 
        });
        saveToStorage();
        localStorage.setItem('unverified_email', email); // [cite: 569]
        navigateTo('#/verify-email'); // [cite: 570]
    });
}

function simulateVerification() {
    const email = localStorage.getItem('unverified_email'); // [cite: 575]
    const account = window.db.accounts.find(a => a.email === email);
    if (account) {
        account.verified = true; // [cite: 576]
        saveToStorage(); // [cite: 577]
        showToast("Email verified!", "success");
        navigateTo('#/login'); // [cite: 578]
    }
}

const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('login-email').value;
        const passwordInput = document.getElementById('login-password').value;

        // Find matching verified account [cite: 582]
        const user = window.db.accounts.find(u => 
            u.email === emailInput && 
            u.password === passwordInput && 
            u.verified === true
        );

        if (user) {
            localStorage.setItem('auth_token', user.email); // [cite: 583]
            setAuthState(true, user); // [cite: 584]
            showToast(`Hello, ${user.firstName}!`, "success");
            setTimeout(() => { navigateTo('#/profile'); }, 150); // [cite: 585]
        } else {
            showToast("Invalid credentials or unverified email.", "danger"); // [cite: 586]
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
        </tr>`).join(''); // [cite: 616]
}

function toggleAccountForm() { // [cite: 617]
    const container = document.getElementById('account-form-container');
    container.classList.toggle('d-none');
    if (container.classList.contains('d-none')) {
        document.getElementById('account-form').reset();
        delete document.getElementById('account-form').dataset.editingId;
    }
}

function editAccount(id) { // [cite: 618]
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
    if (currentUser && id === currentUser.id) return showToast("Cannot delete yourself!", "danger"); // [cite: 620]
    if (confirm("Delete this account?")) { // [cite: 620]
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

function renderDepartments() { // [cite: 624]
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
        </tr>`).join(''); // [cite: 622]
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
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-3">No employees.</td></tr>'; // [cite: 476]
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
        </tr>`).join(''); // [cite: 626]
}

function toggleEmployeeForm() { // [cite: 627]
    const container = document.getElementById('employee-form-container');
    container.classList.toggle('d-none');
    if (!container.classList.contains('d-none')) {
        document.getElementById('emp-dept').innerHTML = window.db.departments.map(d => `<option value="${d.name}">${d.name}</option>`).join(''); // [cite: 631]
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
        if (!window.db.accounts.find(a => a.email === email)) return showToast("Error: Account email not found!", "danger"); // [cite: 629]

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

// ==========================================
// Phase 5 & 7: User Content
// ==========================================

function renderProfile() { // [cite: 609]
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
        </div>`; // [cite: 610, 611]
}

function renderRequests() {
    const tableContainer = document.getElementById('requests-table-container');
    const tableBody = document.getElementById('requests-table-body');
    const myData = window.db.requests.filter(r => r.employeeEmail === currentUser.email); // [cite: 637]
    
    document.getElementById('empty-requests-view').style.display = myData.length === 0 ? 'block' : 'none';
    tableContainer.style.display = myData.length === 0 ? 'none' : 'block';

    if (tableBody) {
        tableBody.innerHTML = myData.map(req => {
            const badge = req.status === 'Approved' ? 'bg-success' : req.status === 'Rejected' ? 'bg-danger' : 'bg-warning'; // [cite: 643]
            const items = req.items.map(i => `${i.name} (${i.qty})`).join(', ');
            return `<tr><td>${req.date}</td><td>${req.type}</td><td><small>${items}</small></td>
                    <td><span class="badge ${badge}">${req.status}</span></td></tr>`;
        }).join('');
    }
}

// Requisition Builder logic
document.addEventListener('click', (e) => {
    const container = document.getElementById('dynamic-items-container');
    if (!container) return;
    if (e.target.classList.contains('add-item-btn')) { // [cite: 640]
        e.preventDefault();
        const newRow = document.createElement('div');
        newRow.className = 'input-group mb-2 item-row';
        newRow.innerHTML = `<input type="text" class="form-control item-name" placeholder="Item name" required>
            <input type="number" class="form-control item-qty text-center" value="1" style="max-width: 60px;" required>
            <button type="button" class="btn btn-outline-danger remove-item-btn">×</button>`;
        container.appendChild(newRow);
    }
    if (e.target.classList.contains('remove-item-btn')) e.target.closest('.item-row').remove(); // [cite: 640]
});

const rForm = document.getElementById('new-request-form');
if (rForm) {
    rForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const items = Array.from(document.querySelectorAll('.item-row')).map(row => ({
            name: row.querySelector('.item-name').value,
            qty: row.querySelector('.item-qty').value
        }));
        
        if (items.length === 0) return showToast("Add at least one item!", "danger"); // 

        window.db.requests.push({ // [cite: 642]
            id: Date.now(),
            date: new Date().toLocaleDateString(),
            type: document.getElementById('req-type').value,
            items: items,
            status: 'Pending',
            employeeEmail: currentUser.email
        });
        saveToStorage(); // [cite: 606]
        bootstrap.Modal.getInstance(document.getElementById('requestModal')).hide();
        e.target.reset();
        renderRequests();
        showToast("Request submitted!", "success");
    });
}

// ==========================================
// Phase 8: Notifications & Init
// ==========================================

function showToast(message, type = 'info') { // [cite: 652]
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
    loadFromStorage(); // [cite: 605]
    const token = localStorage.getItem('auth_token');
    if (token) {
        const user = window.db.accounts.find(u => u.email === token);
        if (user && user.verified) setAuthState(true, user);
    }
    handleRouting();
}

window.addEventListener('hashchange', handleRouting); // [cite: 560]
initApp();