// CampusHub - event discovery and registration.
// All data is saved in this browser using localStorage.

// ---------- Settings ----------
const STORAGE_KEY = 'campusEvents';
const CATEGORIES = ['Workshop', 'Competition', 'Talk', 'Club event'];
const FIELDS = ['title', 'category', 'date', 'time', 'venue', 'capacity', 'description'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STUDENT_ID_PATTERN = /^[A-Z0-9]{4,20}$/;

// Events shown the first time someone opens the page
const SAMPLE_EVENTS = [
  {
    id: 'sample-1',
    title: 'Intro to Web Accessibility',
    category: 'Workshop',
    date: '2026-11-18',
    time: '14:00',
    venue: 'Library Seminar Room 2',
    capacity: 30,
    description: 'A hands-on session on writing web pages that everyone can use.',
    registrations: [
      { id: 'sample-r1', name: 'Sample Student', studentId: 'S1001', email: 'sample@example.com', status: 'Confirmed' }
    ]
  },
  {
    id: 'sample-2',
    title: 'Inter-Department Coding Contest',
    category: 'Competition',
    date: '2026-11-20',
    time: '10:00',
    venue: 'Computer Lab 3',
    capacity: 10,
    description: 'Teams of two solve five problems in three hours.',
    registrations: []
  },
  {
    id: 'sample-3',
    title: 'Careers in Data Science',
    category: 'Talk',
    date: '2026-11-24',
    time: '16:00',
    venue: 'Main Auditorium',
    capacity: 150,
    description: 'Alumni share their first steps into data careers.',
    registrations: []
  },
  {
    id: 'sample-4',
    title: 'Photography Club: Golden Hour Walk',
    category: 'Club event',
    date: '2026-11-27',
    time: '17:00',
    venue: 'North Campus Gate',
    capacity: 24,
    description: 'Bring a camera or phone and explore campus light with the photography club.',
    registrations: []
  }
];

// ---------- Page elements ----------
function byId(id) {
  return document.getElementById(id);
}

const form = byId('event-form');
const list = byId('event-list');
const message = byId('message');
const search = byId('search');
const categoryFilter = byId('filter-category');
const statusFilter = byId('filter-status');
const modal = byId('about-modal');

// ---------- Variables that change while the page is open ----------
let events = [];        // all events
let editingId = null;   // id of the event being edited, or null
let messageTimer;       // timer that hides the message box
let returnFocus;        // element to focus again after closing the dialog

// ---------- Small helper functions ----------

// Makes a unique id like "event-1731312000000-k3j9x2"
function makeId() {
  return 'event-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
}

// Date and time when the event starts
function startTime(event) {
  return new Date(event.date + 'T' + (event.time || '00:00'));
}

// Number of confirmed registrations
function confirmedCount(event) {
  return event.registrations.filter(reg => reg.status === 'Confirmed').length;
}

// Seats still free (never below 0)
function seatsLeft(event) {
  return Math.max(0, Number(event.capacity) - confirmedCount(event));
}

// Open, Almost full, Full or Past
function getStatus(event) {
  if (startTime(event) < new Date()) return 'Past';
  if (seatsLeft(event) <= 0) return 'Full';
  if (seatsLeft(event) <= Number(event.capacity) * 0.2) return 'Almost full';
  return 'Open';
}

// Changes special characters so user text can't break the page (prevents XSS)
function escapeHtml(value) {
  const chars = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(value ?? '').replace(/[&<>"']/g, ch => chars[ch]);
}

// Example: "Wed, 18 Nov 2026, 02:00 pm"
function formatDate(event) {
  return startTime(event).toLocaleString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Shows a message in the corner for 3.5 seconds
function notify(text, type = 'success') {
  message.textContent = text;
  message.className = 'toast toast-' + type;
  message.hidden = false;
  clearTimeout(messageTimer);
  messageTimer = setTimeout(() => {
    message.hidden = true;
  }, 3500);
}

// ---------- Saving and loading ----------

function loadEvents() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === null) return SAMPLE_EVENTS;

    const data = JSON.parse(saved);
    const isValid = Array.isArray(data) &&
      data.every(e => e && typeof e.title === 'string' && Array.isArray(e.registrations));
    if (!isValid) throw new Error('Invalid event data');

    return data;
  } catch (error) {
    console.error(error);
    notify('Saved data could not be read. Showing sample events.', 'error');
    return SAMPLE_EVENTS;
  }
}

function saveEvents(nextEvents) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextEvents));
    return true;
  } catch (error) {
    console.error(error);
    notify('Changes could not be saved in this browser.', 'error');
    return false;
  }
}

// Saves the new list, then redraws the page
function updateEvents(nextEvents) {
  if (!saveEvents(nextEvents)) return false;
  events = nextEvents;
  render();
  return true;
}

// ---------- Form checking ----------

// Returns an object like { title: 'Enter at least 3 characters.' }
function validateEvent(input) {
  const errors = {};
  const capacity = Number(input.capacity);

  if (input.title.trim().length < 3) errors.title = 'Enter at least 3 characters.';
  if (!CATEGORIES.includes(input.category)) errors.category = 'Choose a category.';
  if (!input.date) errors.date = 'Choose a date.';
  if (!input.time) errors.time = 'Choose a start time.';
  if (input.date && input.time && startTime(input) < new Date()) {
    errors.date = 'Choose a future date and time.';
  }
  if (input.venue.trim().length < 3) errors.venue = 'Enter at least 3 characters.';
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 1000) {
    errors.capacity = 'Enter a whole number from 1 to 1000.';
  }
  if (input.description.trim().length < 10) errors.description = 'Enter at least 10 characters.';

  // When editing, capacity can't go below the people already registered
  const current = events.find(e => e.id === editingId);
  if (current && Number.isInteger(capacity) && capacity < confirmedCount(current)) {
    errors.capacity = 'Capacity cannot be below confirmed registrations.';
  }

  return errors;
}

// Shows each error under its field and marks the field red
function showErrors(errors) {
  FIELDS.forEach(field => {
    const input = form.elements.namedItem(field);
    const text = errors[field] || '';
    byId('error-' + field).textContent = text;

    if (text) {
      input.setAttribute('aria-invalid', 'true');
    } else {
      input.removeAttribute('aria-invalid');
    }
  });
}

// ---------- Drawing the page ----------

// Updates the four numbers at the top
function renderDashboard() {
  const upcoming = events.filter(e => getStatus(e) !== 'Past');
  const totalConfirmed = events.reduce((sum, e) => sum + confirmedCount(e), 0);
  const totalSeats = upcoming.reduce((sum, e) => sum + seatsLeft(e), 0);

  byId('stat-total').textContent = events.length;
  byId('stat-upcoming').textContent = upcoming.length;
  byId('stat-registrations').textContent = totalConfirmed;
  byId('stat-seats').textContent = totalSeats;
}

// HTML for the list of people registered for one event
function registrationListHtml(event) {
  if (!event.registrations.length) {
    return '<p class="muted">No registrations yet.</p>';
  }

  const items = event.registrations.map(reg => {
    const isConfirmed = reg.status === 'Confirmed';
    const cancelButton = isConfirmed
      ? `<button type="button" class="link-button" data-action="cancel" data-id="${escapeHtml(event.id)}" data-reg-id="${escapeHtml(reg.id)}">Cancel</button>`
      : '';

    return `<li>
      <span>${escapeHtml(reg.name)} · ${escapeHtml(reg.studentId)}</span>
      <span class="${isConfirmed ? 'reg-confirmed' : 'reg-cancelled'}">${escapeHtml(reg.status)}</span>
      ${cancelButton}
    </li>`;
  });

  return `<ul class="reg-list">${items.join('')}</ul>`;
}

// HTML for the registration form (or a note if registration is closed)
function registerFormHtml(event, status) {
  if (status === 'Past' || status === 'Full') {
    return '<p class="muted">Registration is closed for this event.</p>';
  }

  return `<form class="register-form" data-event-id="${escapeHtml(event.id)}" novalidate>
    <label>Full name <input name="name" autocomplete="name" required></label>
    <label>Student ID <input name="studentId" required></label>
    <label>Email <input name="email" type="email" autocomplete="email" required></label>
    <button class="btn primary" type="submit">Confirm registration</button>
  </form>`;
}

// HTML for one event card
function eventCardHtml(event) {
  const status = getStatus(event);
  const statusClass = 'status-' + status.toLowerCase().replaceAll(' ', '-');

  return `<article class="event-card">
    <div class="card-top">
      <span class="badge">${escapeHtml(event.category)}</span>
      <span class="status ${statusClass}">${escapeHtml(status)}</span>
    </div>
    <h3>${escapeHtml(event.title)}</h3>
    <p class="meta">${escapeHtml(formatDate(event))}</p>
    <p class="meta">${escapeHtml(event.venue)}</p>
    <p class="description">${escapeHtml(event.description)}</p>
    <p class="seats"><strong>${seatsLeft(event)}</strong> of ${Number(event.capacity)} seats available · ${confirmedCount(event)} confirmed</p>
    <div class="card-actions">
      <button class="btn secondary" type="button" data-action="edit" data-id="${escapeHtml(event.id)}">Edit event</button>
      <button class="btn danger" type="button" data-action="delete" data-id="${escapeHtml(event.id)}">Delete</button>
    </div>
    <details>
      <summary>Registrations (${event.registrations.length})</summary>
      ${registrationListHtml(event)}
      ${registerFormHtml(event, status)}
    </details>
  </article>`;
}

// Shows the events that match the search and filters, sorted by date
function renderList() {
  const query = search.value.trim().toLowerCase();

  const visible = events
    .filter(e => {
      const text = (e.title + ' ' + e.venue + ' ' + e.description).toLowerCase();
      const matchesSearch = !query || text.includes(query);
      const matchesCategory = !categoryFilter.value || e.category === categoryFilter.value;
      const matchesStatus = !statusFilter.value || getStatus(e) === statusFilter.value;
      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => startTime(a) - startTime(b));

  byId('result-count').textContent = visible.length + (visible.length === 1 ? ' event' : ' events');

  if (visible.length) {
    list.innerHTML = visible.map(eventCardHtml).join('');
  } else {
    list.innerHTML = '<p class="empty">No events match your search. Try another keyword or filter.</p>';
  }
}

function render() {
  renderDashboard();
  renderList();
}

// ---------- Create, edit and delete events ----------

function resetForm() {
  form.reset();
  editingId = null;
  byId('form-heading').textContent = 'Create an event';
  byId('save-button').textContent = 'Add event';
  byId('cancel-edit').hidden = true;
  showErrors({});
}

// Fills the form with an event so it can be changed
function startEditing(eventId) {
  const event = events.find(e => e.id === eventId);
  if (!event) return;

  editingId = eventId;
  FIELDS.forEach(field => {
    form.elements.namedItem(field).value = event[field];
  });

  byId('form-heading').textContent = 'Edit event';
  byId('save-button').textContent = 'Save changes';
  byId('cancel-edit').hidden = false;
  showErrors({});
  form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  form.elements.namedItem('title').focus();
}

function deleteEvent(eventId) {
  const item = events.find(e => e.id === eventId);
  if (!item) return;
  if (!confirm(`Delete “${item.title}” and its registrations?`)) return;

  if (editingId === eventId) resetForm();
  if (updateEvents(events.filter(e => e.id !== eventId))) {
    notify('Event deleted.');
  }
}

// When the create/edit form is submitted
form.addEventListener('submit', event => {
  event.preventDefault();

  // Read every field into an object like { title: '...', category: '...' }
  const input = {};
  FIELDS.forEach(field => {
    input[field] = form.elements.namedItem(field).value;
  });

  const errors = validateEvent(input);
  showErrors(errors);
  if (Object.keys(errors).length) {
    notify('Please correct the highlighted fields.', 'error');
    return;
  }

  const record = {
    ...input,
    title: input.title.trim(),
    venue: input.venue.trim(),
    description: input.description.trim(),
    capacity: Number(input.capacity)
  };

  const wasEditing = Boolean(editingId);
  let nextEvents;
  if (wasEditing) {
    nextEvents = events.map(e => (e.id === editingId ? { ...e, ...record } : e));
  } else {
    nextEvents = [...events, { id: makeId(), ...record, registrations: [] }];
  }

  if (updateEvents(nextEvents)) {
    resetForm();
    notify(wasEditing ? 'Event updated.' : 'Event added.');
  }
});

byId('cancel-edit').addEventListener('click', resetForm);

// ---------- Student registration ----------

function registerStudent(eventId, registerForm) {
  const event = events.find(e => e.id === eventId);
  if (!event) return;

  const input = {
    name: registerForm.elements.name.value.trim(),
    studentId: registerForm.elements.studentId.value.trim().toUpperCase(),
    email: registerForm.elements.email.value.trim()
  };

  const errors = [];
  if (input.name.length < 2) errors.push('Enter your full name.');
  if (!STUDENT_ID_PATTERN.test(input.studentId)) errors.push('Student ID must be 4–20 letters or numbers.');
  if (!EMAIL_PATTERN.test(input.email)) errors.push('Enter a valid email.');

  if (getStatus(event) === 'Past') {
    errors.push('This event has already taken place.');
  } else if (seatsLeft(event) <= 0) {
    errors.push('This event is full.');
  }

  const alreadyRegistered = event.registrations.some(
    r => r.status === 'Confirmed' && r.studentId.toUpperCase() === input.studentId
  );
  if (alreadyRegistered) errors.push('This student ID is already registered.');

  if (errors.length) {
    notify(errors.join(' '), 'error');
    return;
  }

  const registration = { id: makeId(), ...input, status: 'Confirmed' };
  const nextEvents = events.map(e =>
    e.id === eventId ? { ...e, registrations: [...e.registrations, registration] } : e
  );

  if (updateEvents(nextEvents)) {
    notify(input.name + ' is registered. Status: Confirmed.');
  }
}

function cancelRegistration(eventId, regId) {
  const nextEvents = events.map(e => {
    if (e.id !== eventId) return e;
    const registrations = e.registrations.map(r => (r.id === regId ? { ...r, status: 'Cancelled' } : r));
    return { ...e, registrations };
  });

  if (updateEvents(nextEvents)) {
    notify('Registration cancelled.');
  }
}

// ---------- Clicks and forms inside the event list ----------
// The cards are redrawn often, so we listen on the list instead of each button.

list.addEventListener('click', event => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const action = button.dataset.action;
  const eventId = button.dataset.id;

  if (action === 'edit') startEditing(eventId);
  if (action === 'delete') deleteEvent(eventId);
  if (action === 'cancel') cancelRegistration(eventId, button.dataset.regId);
});

list.addEventListener('submit', event => {
  if (!event.target.matches('.register-form')) return;
  event.preventDefault();
  registerStudent(event.target.dataset.eventId, event.target);
});

// ---------- Search and filters ----------
search.addEventListener('input', renderList);
categoryFilter.addEventListener('change', renderList);
statusFilter.addEventListener('change', renderList);

// ---------- About dialog ----------

function openAbout() {
  returnFocus = document.activeElement;
  modal.hidden = false;
  byId('close-about').focus();
}

function closeAbout() {
  modal.hidden = true;
  if (returnFocus) returnFocus.focus();
}

byId('open-about').addEventListener('click', openAbout);
byId('close-about').addEventListener('click', closeAbout);
modal.querySelector('.modal-backdrop').addEventListener('click', closeAbout);

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !modal.hidden) closeAbout();
});

// ---------- Start ----------
events = loadEvents();
render();
