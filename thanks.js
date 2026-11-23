// Thank-you page: shows the registration that was just submitted.

// Only logged-in users can see this page
if (!sessionStorage.getItem('campusHubUser')) {
  window.location.replace('login.html');
}

// The registration details were saved by script.js before coming here
const savedRegistration = sessionStorage.getItem('campusHubLastRegistration');

if (savedRegistration) {
  const reg = JSON.parse(savedRegistration);

  // textContent keeps user text safe (no HTML is run)
  document.getElementById('thanks-message').textContent =
    'Thank you, ' + reg.name + '. Your seat is confirmed.';
  document.getElementById('thanks-name').textContent = reg.name;
  document.getElementById('thanks-student-id').textContent = reg.studentId;
  document.getElementById('thanks-event').textContent = reg.eventTitle;
  document.getElementById('thanks-when').textContent = reg.eventDate;
  document.getElementById('thanks-venue').textContent = reg.venue;
  document.getElementById('thanks-details').hidden = false;
}

document.getElementById('thanks-logout').addEventListener('click', function () {
  sessionStorage.removeItem('campusHubUser');
  sessionStorage.removeItem('campusHubLastRegistration');
  window.location.href = 'login.html';
});
