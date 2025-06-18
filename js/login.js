// Function to handle Remember Me functionality
function handleRememberMe() {
    const rememberMe = document.getElementById('rememberMe');
    const loginEmail = document.getElementById('loginEmail');

    // Check if there's a saved email
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
        loginEmail.value = savedEmail;
        rememberMe.checked = true;
    }
}

// Function to save email if Remember Me is checked
function saveRememberMe() {
    const rememberMe = document.getElementById('rememberMe');
    const loginEmail = document.getElementById('loginEmail');

    if (rememberMe.checked) {
        localStorage.setItem('rememberedEmail', loginEmail.value);
    } else {
        localStorage.removeItem('rememberedEmail');
    }
}

// Add event listeners when the document loads
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    
    // Load remembered email if exists
    handleRememberMe();

    // Save email when form is submitted
    loginForm.addEventListener('submit', (e) => {
        saveRememberMe();
    });
}); 