class AuthManager {
    constructor() {
        this.init();
    }

    init() {
        // Check login state on page load
        this.checkLoginState();
        
        // Add logout handler
        const logoutBtn = document.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => this.handleLogout(e));
        }

        // Add register form handler
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
    }

    checkLoginState() {
        const userData = localStorage.getItem('userData');
        if (userData) {
            const user = JSON.parse(userData);
            this.updateAuthUI(user);
        } else {
            this.updateAuthUI(null);
        }
    }

    updateAuthUI(user) {
        const authLink = document.getElementById('authLink');
        if (!authLink) return;

        if (user) {
            authLink.innerHTML = `
                <i class="fas fa-user"></i>
                <span>${user.name}</span>
            `;
            authLink.href = '/dashboard.html';
            authLink.classList.add('logged-in');
        } else {
            authLink.innerHTML = `
                <i class="fas fa-sign-in-alt"></i>
                <span>Sign Up</span>
            `;
            authLink.href = '#';
            authLink.classList.remove('logged-in');
        }
    }

    async handleLogout(e) {
        e.preventDefault();
        
        try {
            // Show loading state
            const logoutBtn = e.target;
            logoutBtn.classList.add('loading');
            logoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging out...';

            // Call logout API
            const response = await fetch('/api/logout', {
                method: 'POST',
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Logout failed');
            }

            // Clear all stored data
            localStorage.removeItem('userData');
            sessionStorage.removeItem('dashboardVisited');
            
            // Show logout popup
            const logoutPopup = document.getElementById('logoutPopup');
            if (logoutPopup) {
                logoutPopup.classList.add('show');
                
                // Redirect to home after delay
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            } else {
                // If no popup, redirect immediately
                window.location.href = '/';
            }

        } catch (error) {
            console.error('Logout error:', error);
            // Handle error (show message to user)
            alert('Failed to logout. Please try again.');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const registerError = document.getElementById('registerError');
        const registerSuccess = document.getElementById('registerSuccess');
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        // Clear previous messages
        registerError.style.display = 'none';
        registerSuccess.style.display = 'none';
        
        // Get form data
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
        
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password }),
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }
            
            // Show success message
            registerSuccess.textContent = 'Registration successful! Please login.';
            registerSuccess.style.display = 'block';
            
            // Reset form
            e.target.reset();
            
            // Switch to login form after delay
            setTimeout(() => {
                document.getElementById('registerForm').classList.remove('active');
                document.getElementById('loginForm').classList.add('active');
                // Pre-fill email in login form
                document.getElementById('loginEmail').value = email;
            }, 2000);
            
        } catch (error) {
            console.error('Registration error:', error);
            registerError.textContent = error.message;
            registerError.style.display = 'block';
        } finally {
            // Restore button state
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Create Account';
        }
    }
}

// Export the class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
} 