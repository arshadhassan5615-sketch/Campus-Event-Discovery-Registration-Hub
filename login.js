// Login page: checks the username and password against a fixed list.
// There is no database, so the accounts live in this file.

// Accounts allowed to log in (change these to your own)
const ACCOUNTS = [
  { username: 'student', password: 'campus123' },
  { username: 'admin', password: 'admin123' }
];

const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');

loginForm.addEventListener('submit', function (event) {
  event.preventDefault();

  const username = loginForm.elements.username.value.trim();
  const password = loginForm.elements.password.value;

  // Look for an account that matches both the username and the password
  const found = ACCOUNTS.find(account =>
    account.username === username && account.password === password
  );

  if (!found) {
    loginError.textContent = 'Wrong username or password. Please try again.';
    loginForm.elements.password.value = '';
    return;
  }

  // Remember the user for this browser tab, then open the main page
  sessionStorage.setItem('campusHubUser', found.username);
  window.location.href = 'index.html';
});
