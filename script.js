// Phase 2: Core Routing Variables
let currentUser = null; // [cite: 186]

// Phase 2: handleRouting function
function handleRouting() {
    const hash = window.location.hash || '#/'; // [cite: 189]

    // 1. Hide all page elements first [cite: 190]
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // 2. Show ONLY the matching page [cite: 191]
    if (hash === '#/' || hash === '') {
        document.getElementById('home-page').classList.add('active');
    } else if (hash === '#/login') {
        document.getElementById('login-page').classList.add('active');
    } else if (hash === '#/register') {
        document.getElementById('register-page').classList.add('active');
    } else if (hash === '#/profile') {
        // Blocks unauthenticated users from seeing the profile [cite: 192]
        if (!currentUser) {
            window.location.hash = '#/login';
        } else {
            document.getElementById('profile-page').classList.add('active');
        }
    } else if (hash === '#/logout') {
        handleLogout();
    }
}

// Phase 3E: Logout Logic [cite: 226]
function handleLogout() {
    localStorage.removeItem('auth_token'); // [cite: 227]
    setAuthState(false); // [cite: 228]
    window.location.hash = '#/'; // [cite: 229]
}

// Phase 3D placeholder
function setAuthState(isAuth, user = null) {
    const body = document.body;
    if (isAuth) {
        body.classList.replace('not-authenticated', 'authenticated');
    } else {
        body.classList.replace('authenticated', 'not-authenticated');
        body.classList.remove('is-admin');
    }
}

// Listen for hash changes [cite: 194]
window.addEventListener('hashchange', handleRouting);

// Initialize on page load [cite: 195]
handleRouting();