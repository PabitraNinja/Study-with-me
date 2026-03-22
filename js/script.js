// Base API URL
const API_URL = 'http://localhost:5000/api';

// Modal Functions
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function openLoginModal(role) {
    document.getElementById('login-intended-role').value = role;
    document.getElementById('login-modal-title').innerText = role === 'admin' ? 'Login as Admin' : 'Login as User';
    openModal('login-modal');
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// Authentication Logic
document.getElementById('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const intendedRole = document.getElementById('login-intended-role').value;
    
    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await res.json();
        
        if (res.ok) {
            // Strictly enforce role-based login
            if (intendedRole !== data.role) {
                alert(`Access Denied. You are trying to login as ${intendedRole}, but your account role is ${data.role}.`);
                return;
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('role', data.role);
            localStorage.setItem('username', data.username);
            closeModal('login-modal');
            updateUI();
        } else {
            alert(data.error || 'Login failed');
        }
    } catch (err) {
        console.error(err);
        alert('Server error. Ensure backend is running.');
    }
});

document.getElementById('register-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const role = document.getElementById('register-role').value;

    try {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, role })
        });
        
        const data = await res.json();
        
        if (res.ok) {
            alert('Registration successful! You can now login.');
            closeModal('register-modal');
            openModal('login-modal');
        } else {
            alert(data.error || 'Registration failed');
        }
    } catch (err) {
        console.error(err);
        alert('Server error. Ensure backend is running.');
    }
});

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    updateUI();
}

function updateUI() {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const username = localStorage.getItem('username');

    const authButtons = document.getElementById('auth-buttons');
    const userProfile = document.getElementById('user-profile');
    const adminLink = document.getElementById('admin-dashboard-link');
    // Note: We need to find the user dashboard link. Assuming it's the previous sibling of adminLink based on current HTML.
    const myDashboardLink = userProfile ? userProfile.querySelector('a[href="dashboard.html"]') : null;
    const userGreeting = document.getElementById('user-greeting');
    const examsSection = document.getElementById('exams');
    const navExams = document.getElementById('nav-exams');
    const loginPrompt = document.getElementById('login-prompt');
    const startBtn = document.getElementById('start-btn');

    if (token) {
        // Logged in
        authButtons.style.display = 'none';
        userProfile.style.display = 'flex';
        userGreeting.textContent = `Hello, ${username}`;
        
        examsSection.style.display = 'block';
        navExams.style.display = 'block';
        loginPrompt.style.display = 'none';
        startBtn.style.display = 'inline-block';
        
        loadDynamicExams(); // Load exams if logged in
        
        if (role === 'admin') {
            if (adminLink) adminLink.style.display = 'inline-block';
            if (myDashboardLink) myDashboardLink.style.display = 'none'; // Hide User Dashboard for Admins
        } else {
            if (adminLink) adminLink.style.display = 'none'; // Hide Admin Dashboard for Users
            if (myDashboardLink) myDashboardLink.style.display = 'inline-block'; // Show User Dashboard
        }
    } else {
        // Logged out
        authButtons.style.display = 'flex';
        userProfile.style.display = 'none';
        
        examsSection.style.display = 'none';
        navExams.style.display = 'none';
        loginPrompt.style.display = 'block';
        startBtn.style.display = 'none';
    }
}

async function loadDynamicExams() {
    const container = document.getElementById('dynamic-exams-container');
    if (!container) return; // Only run on index.html

    try {
        const res = await fetch(`${API_URL}/exams`);
        const exams = await res.json();
        
        container.innerHTML = ''; // Clear loading message
        
        if (!exams || exams.length === 0) {
            container.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: var(--secondary-color);">No live exams available at the moment. Check back later!</p>';
            return;
        }

        exams.forEach(exam => {
            const card = document.createElement('div');
            card.className = 'exam-card interactive-card';
            // Append examName to the link for tracking
            const testLink = `${exam.link}?examName=${encodeURIComponent(exam.title)}`;
            card.innerHTML = `
                <div class="exam-badge">Live Test</div>
                <h3>${exam.title}</h3>
                <p>${exam.description}</p>
                <a href="${testLink}" class="btn btn-primary">Start Live Test</a>
            `;
            container.appendChild(card);
        });
    } catch (err) {
        console.error('Error loading exams:', err);
        container.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: #ef4444;">Failed to load live exams.</p>';
    }
}

// Initialize UI on load
document.addEventListener('DOMContentLoaded', updateUI);