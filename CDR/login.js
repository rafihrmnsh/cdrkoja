const loginForm = document.getElementById('login-form');
const errorMessage = document.getElementById('error-message');

loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    errorMessage.textContent = '';

    const username = loginForm.username.value;
    const password = loginForm.password.value;

    // Hardcoded credentials
    if (username === 'solo' && password === 'solo123') {
        // Simulate a login session
        localStorage.setItem('loggedIn', 'true');
        console.log('Logged in successfully');
        // Redirect to the dashboard after successful login
        window.location.href = 'dashboard.html';
    } else {
        errorMessage.textContent = 'Invalid username or password';
    }
});
