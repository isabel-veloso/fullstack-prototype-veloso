let currentUser = null;
const STORAGE_KEY = 'ipt_demo_v1'; 

window.db = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
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

function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
}

// Phase 2 & 3: Routing & Auth State Management
function handleRouting() {
    const hash = window.location.hash || '#/';
    
    // 1. Catch Logout immediately
    if (hash === '#/logout') {
        handleLogout();
        return;
    }

    // 2. REVERSE BOUNCER: If logged in, don't let them see login/register
    if (currentUser && (hash === '#/login' || hash === '#/register')) {
        window.location.hash = '#/profile';
        return;
    }

    // 3. SECURITY CHECK: Validate permissions BEFORE showing the page
    const adminPages = ['#/employees', '#/accounts', '#/departments'];
    const userPages = ['#/profile', '#/requests'];

    if (userPages.includes(hash) && !currentUser) {
        window.location.hash = '#/login';
        return;
    }
    
    if (adminPages.includes(hash) && (!currentUser || currentUser.role !== 'admin')) {
        window.location.hash = '#/';
        return;
    }

    // 4. NAVIGATION: Now that we know they are allowed, show the page
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
        '#/requests': 'requests-page'
    };

    const targetId = routeMap[hash] || 'home-page';
    const targetElement = document.getElementById(targetId);
    
    if (targetElement) {
        targetElement.classList.add('active');

        // 5. RENDER TRIGGER: Populate tables
        if (hash === '#/profile') renderProfile();
        if (hash === '#/accounts') renderAccounts(); 
        if (hash === '#/departments') renderDepartments();
        if (hash === '#/employees') renderEmployees(); 
        if (hash === '#/requests') renderRequests(); 
    }
}


function setAuthState(isAuth, user = null) {
    const body = document.body;
    const navName = document.getElementById('nav-user-name'); 
    
    currentUser = user; 
    if (isAuth && user) {
        // Toggle body classes for navbar visibility
        body.classList.replace('not-authenticated', 'authenticated');
        
        if (user.role === 'admin') {
            body.classList.add('is-admin');
            if (navName) navName.innerText = "Admin"; 
        } else {
            if (navName) navName.innerText = user.firstName; 
        }
    } else {
        // Logout / Reset Logic
        body.classList.replace('authenticated', 'not-authenticated');
        body.classList.remove('is-admin');
        if (navName) navName.innerText = "User";
        currentUser = null;
    }
}

/**
 * handleLogout(): Clears session and forces redirect to Home hash
 */
function handleLogout() {
    // Requirement: Clear auth_token from localStorage
    localStorage.removeItem('auth_token');
    
    // Requirement: Call setAuthState(false)
    setAuthState(false);
    
    // Requirement: Navigate to home
    window.location.hash = '#/'; 
    
    showToast("Logged out successfully", "info");
}

// Phase 3: Registration & Login Logic
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
            role: 'user', verified: false 
        });
        saveToStorage();
        localStorage.setItem('unverified_email', email);
        window.location.hash = '#/verify-email';
    });
}

function simulateVerification() {
    const email = localStorage.getItem('unverified_email');
    const account = window.db.accounts.find(a => a.email === email);
    if (account) {
        account.verified = true;
        saveToStorage();
        sessionStorage.setItem('show_verified_alert', 'true');
        window.location.hash = '#/login';
    }
}

const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('login-email').value;
        const passwordInput = document.getElementById('login-password').value;

        // Requirement: Find account with matching email, password, and verified: true
        const user = window.db.accounts.find(u => 
            u.email === emailInput && 
            u.password === passwordInput && 
            u.verified === true
        );

        if (user) {
            localStorage.setItem('auth_token', user.email); 
            setAuthState(true, user);
            
            // 1. Show the Toast first
            showToast(`Hello, ${user.firstName}!`, "success");
            
            // 2. Delay the redirect slightly (100ms is enough to be invisible to users but helps JS)
            setTimeout(() => {
                window.location.hash = '#/profile'; 
            }, 150);
        }else{
            showToast(`Login Unsucessful!`, "danger");
        }
    });
}

// Phase 6: Admin Management (Inline Forms)
// --- Accounts ---
function renderAccounts() {
    const tbody = document.getElementById('accounts-table-body');
    if (!tbody) return;

    if (window.db.accounts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-3">No accounts found.</td></tr>';
        return;
    }

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
        </tr>
    `).join('');
}

function toggleAccountForm() {
    const container = document.getElementById('account-form-container');
    if (!container) return;
    
    container.classList.toggle('d-none');
    
    // Reset form if we just closed it
    if (container.classList.contains('d-none')) {
        const form = document.getElementById('account-form');
        form.reset();
        delete form.dataset.editingId;
    }
}



function editAccount(id) {
    const acc = window.db.accounts.find(a => a.id === id);
    if (!acc) return;

    // Show form
    const container = document.getElementById('account-form-container');
    container.classList.remove('d-none');

    // Pre-fill fields
    document.getElementById('acc-firstname').value = acc.firstName;
    document.getElementById('acc-lastname').value = acc.lastName;
    document.getElementById('acc-email').value = acc.email;
    document.getElementById('acc-role').value = acc.role;
    document.getElementById('acc-verified').checked = acc.verified;
    
    // Hide password field during edit (optional security preference) or leave empty
    document.getElementById('acc-password').removeAttribute('required');

    // Store the ID we are editing in a data attribute
    document.getElementById('account-form').dataset.editingId = id;
    
    // Scroll to form
    container.scrollIntoView({ behavior: 'smooth' });
}

function resetPassword(id) {
    // Prevent self-reset via this method to force standard profile flow
    if (currentUser && id === currentUser.id) {
        return showToast("Please use the Profile page to change your own password.", "info");
    }

    const newPassword = prompt("Enter new password for this account (min 6 characters):");
    
    if (newPassword === null) return; // User cancelled

    if (newPassword.length < 6) {
        return showToast("Error: Password must be at least 6 characters.", "danger");
    }

    const acc = window.db.accounts.find(a => a.id === id);
    if (acc) {
        acc.password = newPassword;
        saveToStorage();
        showToast(`Password for ${acc.email} has been updated.`, "success");
    }
}

function deleteAccount(id) {
    //Prevent self-deletion
    if (currentUser && id === currentUser.id) {
        return showToast("Safety Error: You cannot delete the account you are currently logged into!", "danger");
    }

    if (confirm("Are you sure you want to delete this account? This cannot be undone.")) {
        window.db.accounts = window.db.accounts.filter(a => a.id !== id);
        saveToStorage();
        renderAccounts();
        showToast("Account removed successfully.", "info");
    }
}

const accForm = document.getElementById('account-form');
if (accForm) {
    accForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const editingId = e.target.dataset.editingId;
        const email = document.getElementById('acc-email').value;

        if (editingId) {
            // UPDATE LOGIC
            const acc = window.db.accounts.find(a => a.id == editingId);
            if (acc) {
                acc.firstName = document.getElementById('acc-firstname').value;
                acc.lastName = document.getElementById('acc-lastname').value;
                acc.email = email;
                acc.role = document.getElementById('acc-role').value;
                acc.verified = document.getElementById('acc-verified').checked;
                
                const pass = document.getElementById('acc-password').value;
                if (pass) acc.password = pass;
                
                showToast("Account updated successfully!", "success");
            }
        } else {
            // CREATE LOGIC
            if (window.db.accounts.find(a => a.email === email)) {
                return showToast("Error: Email already exists.", "danger");
            }

            const newAccount = {
                id: Date.now(),
                firstName: document.getElementById('acc-firstname').value,
                lastName: document.getElementById('acc-lastname').value,
                email: email,
                password: document.getElementById('acc-password').value || "Password123!",
                role: document.getElementById('acc-role').value,
                verified: document.getElementById('acc-verified').checked
            };

            window.db.accounts.push(newAccount);
            showToast("Account added successfully!", "success");
        }

        // Final UI updates (Only run these once at the end)
        saveToStorage(); 
        renderAccounts(); 
        toggleAccountForm(); 
        e.target.reset(); // Clear the form fields
    });
}

// --- Departments ---
function toggleDeptForm() {
    const container = document.getElementById('dept-form-container');
    container.classList.toggle('d-none');
    
    // If we are closing the form, clear the edit mode data
    if (container.classList.contains('d-none')) {
        const form = document.getElementById('dept-form');
        form.reset();
        delete form.dataset.editIndex;
    }
}

function renderDepartments() {
    const tableBody = document.getElementById('dept-list-body');
    if (!tableBody) return;
    tableBody.innerHTML = window.db.departments.map((dept, index) => `
        <tr>
            <td class="fw-semibold">${dept.name}</td>
            <td class="text-secondary">${dept.desc}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editDepartment(${index})">Edit</button>
                <button class="btn btn-sm btn-outline-danger" onclick="removeDepartment(${index})">Delete</button>
            </td>
        </tr>`).join('');
}

function removeDepartment(index) {
    if (confirm("Remove this department?")) {
        window.db.departments.splice(index, 1);
        saveToStorage();
        renderDepartments();
        showToast("Department removed", "info");
    }
}

function editDepartment(index) {
    const dept = window.db.departments[index];
    if (!dept) return;

    // Pre-fill the form fields
    document.getElementById('new-dept-name').value = dept.name;
    document.getElementById('new-dept-desc').value = dept.desc;

    // Store the index in the form so we know we are editing
    const form = document.getElementById('dept-form');
    form.dataset.editIndex = index;

    // Show the form
    toggleDeptForm();
    
    // Smooth scroll to form
    document.getElementById('dept-form-container').scrollIntoView({ behavior: 'smooth' });
}

const dForm = document.getElementById('dept-form');
if (dForm) {
    dForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('new-dept-name').value;
        const desc = document.getElementById('new-dept-desc').value;
        const editIndex = e.target.dataset.editIndex;

        if (editIndex !== undefined && editIndex !== "") {
            // UPDATE MODE
            window.db.departments[editIndex] = { name, desc };
            showToast("Department updated successfully!", "success");
            
            // Clear the index so the form resets to "Create" mode
            delete e.target.dataset.editIndex;
        } else {
            // CREATE MODE
            window.db.departments.push({ name, desc });
            showToast("Department added successfully!", "success");
        }

        saveToStorage();
        e.target.reset();
        toggleDeptForm();
        renderDepartments();
    });
}

// --- Employees ---
function toggleEmployeeForm() {
    const container = document.getElementById('employee-form-container');
    container.classList.toggle('d-none');
    
    const form = document.getElementById('employee-form');
    if (container.classList.contains('d-none')) {
        form.reset();
        delete form.dataset.editId;
    } else {
        // Populate departments dropdown whenever form opens
        const deptSelect = document.getElementById('emp-dept');
        deptSelect.innerHTML = window.db.departments.map(d => `<option value="${d.name}">${d.name}</option>`).join('');
    }
}

function renderEmployees() {
    const tbody = document.getElementById('employees-table-body');
    if (!tbody) return;
    if (window.db.employees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-secondary py-3">No employees.</td></tr>';
        return;
    }
    tbody.innerHTML = window.db.employees.map(emp => `
        <tr>
            <td>${emp.id}</td>
            <td>${emp.name}</td>
            <td>${emp.position}</td>
            <td><span class="badge bg-secondary">${emp.dept}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editEmployee('${emp.id}')">Edit</button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteEmployee('${emp.id}')">Remove</button>
            </td>
        </tr>`).join('');
}

function editEmployee(id) {
    const emp = window.db.employees.find(e => e.id === id);
    if (!emp) return;

    // Pre-fill the form fields
    document.getElementById('emp-id').value = emp.id;
    document.getElementById('emp-email').value = emp.email;
    document.getElementById('emp-position').value = emp.position;
    document.getElementById('emp-hire-date').value = emp.hireDate;

    // Store the ID in the form dataset so we know we are editing
    const form = document.getElementById('employee-form');
    form.dataset.editId = id;

    // Show the form and set the department dropdown
    toggleEmployeeForm();
    document.getElementById('emp-dept').value = emp.dept;
    
    // Smooth scroll to form
    document.getElementById('employee-form-container').scrollIntoView({ behavior: 'smooth' });
}

function deleteEmployee(id) {
    if (confirm("Remove employee record?")) {
        window.db.employees = window.db.employees.filter(e => e.id !== id);
        saveToStorage();
        renderEmployees();
        showToast("Employee removed", "info");
    }
}

const eForm = document.getElementById('employee-form');
if (eForm) {
    eForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = document.getElementById('emp-email').value;
        const editId = e.target.dataset.editId;
        const account = window.db.accounts.find(a => a.email === email);

        if (!account) return showToast("Error: Account email not found!", "danger");

        const employeeData = {
            id: document.getElementById('emp-id').value,
            name: `${account.firstName} ${account.lastName}`,
            email: email,
            position: document.getElementById('emp-position').value,
            dept: document.getElementById('emp-dept').value,
            hireDate: document.getElementById('emp-hire-date').value
        };

        if (editId) {
            // UPDATE MODE: Find the index and replace the record
            const index = window.db.employees.findIndex(emp => emp.id === editId);
            if (index !== -1) {
                window.db.employees[index] = employeeData;
                showToast("Employee record updated!", "success");
            }
            delete e.target.dataset.editId; // Clear edit mode
        } else {
            // CREATE MODE: Add new record
            window.db.employees.push(employeeData);
            showToast("Employee record created!", "success");
        }

        saveToStorage();
        e.target.reset();
        toggleEmployeeForm();
        renderEmployees(); 
    });
}

// Phase 5 & 7: User Content
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
        </div>
    `;
}

function renderRequests() {
    const tableContainer = document.getElementById('requests-table-container');
    const tableBody = document.getElementById('requests-table-body');
    const myData = window.db.requests.filter(r => r.employeeEmail === currentUser.email); 
    
    document.getElementById('empty-requests-view').style.display = myData.length === 0 ? 'block' : 'none';
    tableContainer.style.display = myData.length === 0 ? 'none' : 'block';

    if (tableBody) {
        tableBody.innerHTML = myData.map(req => {
            let badge = req.status === 'Approved' ? 'bg-success' : req.status === 'Rejected' ? 'bg-danger' : 'bg-warning';
            const items = req.items.map(i => `${i.name} (${i.qty})`).join(', ');
            return `<tr><td>${req.date}</td><td>${req.type}</td><td><small>${items}</small></td>
                    <td><span class="badge ${badge}">${req.status}</span></td></tr>`;
        }).join('');
    }
}

// Requisition Builder Fields
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
        window.db.requests.push({
            id: Date.now(),
            date: new Date().toLocaleDateString(),
            type: document.getElementById('req-type').value,
            items: Array.from(document.querySelectorAll('.item-row')).map(row => ({
                name: row.querySelector('.item-name').value,
                qty: row.querySelector('.item-qty').value
            })),
            status: 'Pending',
            employeeEmail: currentUser.email
        });
        saveToStorage();
        bootstrap.Modal.getInstance(document.getElementById('requestModal')).hide();
        e.target.reset();
        renderRequests();
        showToast("Request submitted successfully!", "success");
    });
}

// Phase 8: Notifications
function showToast(message, type = 'info') {
    const toastEl = document.getElementById('liveToast');
    const toastStyling = document.getElementById('toast-styling');
    const toastMessage = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');
    
    if (!toastEl) return;
    const colors = {
        success: { bg: 'bg-success', text: 'text-white', icon: '✅' },
        danger: { bg: 'bg-danger', text: 'text-white', icon: '❌' },
        info: { bg: 'bg-info', text: 'text-dark', icon: '⚠️' }
    };

    const config = colors[type] || colors.info;

    toastStyling.className = `d-flex align-items-center p-1 rounded ${config.bg} ${config.text}`;
    
    toastMessage.innerText = message;
    toastIcon.innerText = config.icon;

    const bsToast = new bootstrap.Toast(toastEl, { delay: 4000 });
    bsToast.show();
}

// Initialization: Startup
function initApp() {
    const token = localStorage.getItem('auth_token');
    if (token) {
        const user = window.db.accounts.find(u => u.email === token);
        if (user && user.verified) {
            setAuthState(true, user);
        } else {
            localStorage.removeItem('auth_token'); 
        }
    }
    handleRouting();
}


window.addEventListener('hashchange', handleRouting);
initApp();