// Login and create-account page.
// There is no database. Accounts made on this page are saved in this browser's localStorage.

// Demo accounts that always work (change these to your own)
const DEMO_ACCOUNTS = [
  { username: 'student', password: 'campus123' },
  { username: 'admin', password: 'admin123' }
];

const ACCOUNTS_KEY = 'campusHubAccounts';

const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const signupForm = document.getElementById('signup-form');
const signupError = document.getElementById('signup-error');
const pageTitle = document.getElementById('page-title');
const pageIntro = document.getElementById('page-intro');
const switchToSignup = document.getElementById('switch-to-signup');
const switchToLogin = document.getElementById('switch-to-login');

// Read accounts saved in this browser (an empty list if none or if the data is broken)
function getSavedAccounts() {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY)) || [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

// Demo accounts plus accounts created on this page
function getAllAccounts() {
  return [...DEMO_ACCOUNTS, ...getSavedAccounts()];
}

// Save one new account; returns false if the browser refused to save it
function saveNewAccount(account) {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...getSavedAccounts(), account]));
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

// Switch between the log in form and the create account form
function showForm(isSignup) {
  loginForm.hidden = isSignup;
  switchToSignup.hidden = isSignup;
  signupForm.hidden = !isSignup;
  switchToLogin.hidden = !isSignup;

  pageTitle.textContent = isSignup ? 'Create account' : 'Log in';
  pageIntro.textContent = isSignup
    ? 'Make a new account to register for campus events.'
    : 'Sign in to see campus events and register for a seat.';

  loginError.textContent = '';
  signupError.textContent = '';
}

// Remember the user for this browser tab, then open the main page
function logIn(username) {
  sessionStorage.setItem('campusHubUser', username);
  window.location.href = 'index.html';
}

document.getElementById('show-signup').addEventListener('click', () => showForm(true));
document.getElementById('show-login').addEventListener('click', () => showForm(false));

loginForm.addEventListener('submit', function (event) {
  event.preventDefault();

  const username = loginForm.elements.username.value.trim();
  const password = loginForm.elements.password.value;

  // Look for an account that matches both the username and the password
  const found = getAllAccounts().find(account =>
    account.username === username && account.password === password
  );

  if (!found) {
    loginError.textContent = 'Wrong username or password. Please try again.';
    loginForm.elements.password.value = '';
    return;
  }

  logIn(found.username);
});

signupForm.addEventListener('submit', function (event) {
  event.preventDefault();

  const username = signupForm.elements.username.value.trim();
  const password = signupForm.elements.password.value;
  const confirm = signupForm.elements.confirm.value;

  if (!/^[A-Za-z0-9]{3,20}$/.test(username)) {
    signupError.textContent = 'Username must be 3 to 20 letters or numbers.';
    return;
  }
  if (password.length < 6) {
    signupError.textContent = 'Password must be at least 6 characters.';
    return;
  }
  if (password !== confirm) {
    signupError.textContent = 'The two passwords do not match.';
    return;
  }

  // Usernames are not case-sensitive, so "Ali" and "ali" count as the same
  const taken = getAllAccounts().some(account =>
    account.username.toLowerCase() === username.toLowerCase()
  );
  if (taken) {
    signupError.textContent = 'That username is already taken. Choose another.';
    return;
  }

  if (!saveNewAccount({ username, password })) {
    signupError.textContent = 'The account could not be saved in this browser.';
    return;
  }

  logIn(username);
});
