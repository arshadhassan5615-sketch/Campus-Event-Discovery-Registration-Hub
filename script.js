// script.js
// Campus Event Discovery & Registration Hub.
// Plain JavaScript, no libraries. Records are saved in the browser's localStorage.

// ---------- Settings ----------

const STORAGE_KEY = 'campusEvents';
const CATEGORIES = ['Workshop', 'Competition', 'Talk', 'Club event'];
const EVENT_FIELDS = ['title', 'category', 'date', 'time', 'venue', 'capacity', 'description'];
const MAX_CAPACITY = 1000;
const ALMOST_FULL_SHARE = 0.2; // the last 20% of seats shows "Almost full"
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STUDENT_ID_PATTERN = /^[A-Z0-9]{4,20}$/; // input is upper-cased before checking

// Shown on the very first visit, so the page is not empty. Clear them with
// localStorage.removeItem('campusEvents') in the browser console.
const SAMPLE_EVENTS = [
  {
    id: 'sample-1',
    title: 'Intro to Web Accessibility',
    category: 'Workshop',
    date: '2026-11-12',
    time: '14:00',
    venue: 'Library Seminar Room 2',
    capacity: 30,
    description: 'A hands-on session on writing web pages that everyone can use.',
    registrations: [
      { id: 'sample-r1', name: 'Sample Student', studentId: 'S1001', email: 'sample@example.com', status: 'Confirmed' },
    ],
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
    registrations: [],
  },
  {
    id: 'sample-3',
    title: 'Careers in Data Science',
    category: 'Talk',
    date: '2026-10-20',
    time: '16:00',
    venue: 'Main Auditorium',
    capacity: 150,
    description: 'Alumni share their first steps into data careers.',
    registrations: [],
  },
];

// ---------- Page elements ----------

const messageBox = document.getElementById('message');
const eventForm = document.getElementById('event-form');
const formHeading = document.getElementById('form-heading');
const saveButton = document.getElementById('save-button');
const cancelEditButton = document.getElementById('cancel-edit');
const searchInput = document.getElementById('search');
const categoryFilter = document.getElementById('filter-category');
const statusFilter = document.getElementById('filter-status');
const eventList = document.getElementById('event-list');

// ---------- State ----------
// "events" is the single list of records. Every change creates a new list
// (see addEvent, updateEvent and so on) and then saves it.

let events = [];
let editingId = null; // the id of the event being edited, or null
let messageTimer = null;

// ---------- Storage ----------

function loadEvents() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === null) {
      return SAMPLE_EVENTS;
    }
    return JSON.parse(saved);
  } catch (error) {
    console.error('Could not read saved events.', error);
    showMessage('Saved events could not be read, so the list starts empty.', 'error');
    return [];
  }
}

function saveEvents(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (error) {
    console.error('Could not save events.', error);
    showMessage('Changes could not be saved in this browser.', 'error');
  }
}

// ---------- Status helpers ----------

function getStart(event) {
  return new Date(`${event.date}T${event.time}`);
}

function confirmedCount(event) {
  return event.registrations.filter((reg) => reg.status === 'Confirmed').length;
}

function seatsLeft(event) {
  return event.capacity - confirmedCount(event);
}

// Works out the label shown on each card and used by the status filter.
function getStatus(event, now = new Date()) {
  if (getStart(event) < now) return 'Past';
  const left = seatsLeft(event);
  if (left <= 0) return 'Full';
  if (left <= event.capacity * ALMOST_FULL_SHARE) return 'Almost full';
  return 'Open';
}

// ---------- Validation ----------
// Each function returns an object like { title: 'message' }. An empty object means valid.

function validateEvent(input) {
  const errors = {};
  const capacity = Number(input.capacity);

  if (input.title.trim().length < 3) errors.title = 'Title needs at least 3 characters.';
  if (!CATEGORIES.includes(input.category)) errors.category = 'Choose a category.';
  if (!input.date) errors.date = 'Pick a date.';
  if (!input.time) errors.time = 'Pick a start time.';
  if (input.date && input.time && getStart(input) < new Date()) {
    errors.date = 'The date and time must be in the future.';
  }
  if (input.venue.trim().length < 3) errors.venue = 'Venue needs at least 3 characters.';
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > MAX_CAPACITY) {
    errors.capacity = `Seats must be a whole number from 1 to ${MAX_CAPACITY}.`;
  }
  if (input.description.trim().length < 10) {
    errors.description = 'Description needs at least 10 characters.';
  }
  return errors;
}

// Returns a single message, not a field list, because the form is in a card.
function validateRegistration(event, input) {
  const errors = {};

  if (input.name.trim().length < 2) errors.name = 'Enter your full name.';
  if (!STUDENT_ID_PATTERN.test(input.studentId)) errors.studentId = 'Student ID: 4 to 20 letters or digits.';
  if (!EMAIL_PATTERN.test(input.email)) errors.email = 'Enter a valid email address.';

  const alreadyRegistered = event.registrations.some(
    (reg) => reg.status === 'Confirmed' && reg.studentId === input.studentId
  );
  if (getStatus(event) === 'Past') {
    errors.form = 'This event has already taken place.';
  } else if (seatsLeft(event) <= 0) {
    errors.form = 'Sorry, this event is full.';
  } else if (alreadyRegistered) {
    errors.form = 'This student ID is already registered for the event.';
  }
  return errors;
}

// ---------- Changes to the list (each returns a NEW list) ----------

function toEventRecord(input) {
  return {
    title: input.title.trim(),
    category: input.category,
    date: input.date,
    time: input.time,
    venue: input.venue.trim(),
    capacity: Number(input.capacity),
    description: input.description.trim(),
  };
}

function createId() {
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function addEvent(list, input) {
  return [...list, { id: createId(), ...toEventRecord(input), registrations: [] }];
}

function updateEvent(list, id, input) {
  return list.map((event) => (event.id === id ? { ...event, ...toEventRecord(input) } : event));
}

function deleteEvent(list, id) {
  return list.filter((event) => event.id !== id);
}

function addRegistration(list, eventId, input) {
  const registration = {
    id: createId(),
    name: input.name.trim(),
    studentId: input.studentId,
    email: input.email.trim(),
    status: 'Confirmed',
  };
  return list.map((event) =>
    event.id === eventId
      ? { ...event, registrations: [...event.registrations, registration] }
      : event
  );
}

// Cancelled registrations stay in the list, so the status history is kept.
function cancelRegistration(list, eventId, regId) {
  return list.map((event) =>
    event.id === eventId
      ? {
          ...event,
          registrations: event.registrations.map((reg) =>
            reg.id === regId ? { ...reg, status: 'Cancelled' } : reg
          ),
        }
      : event
  );
}

// ---------- Reading form values ----------

function readEventForm(form) {
  return Object.fromEntries(EVENT_FIELDS.map((field) => [field, form.elements[field].value]));
}

function readRegisterForm(form) {
  return {
    name: form.elements.name.value,
    studentId: form.elements.studentId.value.trim().toUpperCase(),
    email: form.elements.email.value,
  };
}

// ---------- Drawing the page ----------

function setText(id, value) {
  document.getElementById(id).textContent = value;
}

function renderDashboard(list) {
  const upcoming = list.filter((event) => getStatus(event) !== 'Past');
  setText('stat-total', list.length);
  setText('stat-upcoming', upcoming.length);
  setText('stat-registrations', list.reduce((sum, event) => sum + confirmedCount(event), 0));
  setText('stat-seats', upcoming.reduce((sum, event) => sum + seatsLeft(event), 0));
}

// Applies the search box and the two dropdowns, then sorts by date.
function getVisibleEvents(list) {
  const search = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;
  const status = statusFilter.value;

  return list
    .filter((event) => {
      const text = `${event.title} ${event.venue} ${event.description}`.toLowerCase();
      const matchesSearch = search === '' || text.includes(search);
      const matchesCategory = category === '' || event.category === category;
      const matchesStatus = status === '' || getStatus(event) === status;
      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => getStart(a) - getStart(b));
}

function renderEventList(list) {
  const visible = getVisibleEvents(list);
  setText('result-count', `Showing ${visible.length} of ${list.length} events`);

  if (visible.length === 0) {
    eventList.innerHTML = '<p class="empty">No events match these filters.</p>';
    return;
  }
  eventList.innerHTML = visible.map(createEventCard).join('');
}

function renderAll() {
  renderDashboard(events);
  renderEventList(events);
}

// ---------- Building the HTML for one card ----------
// Every value from the user goes through escapeHtml, so typed text
// cannot inject HTML or scripts into the page.

function escapeHtml(value) {
  const escapes = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(value).replace(/[&<>"']/g, (char) => escapes[char]);
}

function formatDate(event) {
  return getStart(event).toLocaleString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function createEventCard(event) {
  const status = getStatus(event);
  const id = escapeHtml(event.id);

  return `
    <article class="event-card">
      <div class="card-top">
        <span class="badge">${escapeHtml(event.category)}</span>
        <span class="status status-${status.toLowerCase().replace(' ', '-')}">${status}</span>
      </div>
      <h3>${escapeHtml(event.title)}</h3>
      <p class="meta">${formatDate(event)} · ${escapeHtml(event.venue)}</p>
      <p>${escapeHtml(event.description)}</p>
      <p class="seats"><strong>${seatsLeft(event)}</strong> of ${event.capacity} seats left</p>
      <div class="card-actions">
        <button type="button" class="btn ghost" data-action="edit" data-id="${id}">Edit</button>
        <button type="button" class="btn ghost danger" data-action="delete" data-id="${id}">Delete</button>
      </div>
      <details>
        <summary>Registrations (${event.registrations.length})</summary>
        ${renderRegistrations(event)}
        ${renderRegisterForm(event, status)}
      </details>
    </article>`;
}

function renderRegistrations(event) {
  if (event.registrations.length === 0) {
    return '<p class="muted">No one has registered yet.</p>';
  }
  const items = event.registrations
    .map((reg) => {
      const statusClass = reg.status === 'Confirmed' ? 'reg-confirmed' : 'reg-cancelled';
      const cancelButton =
        reg.status === 'Confirmed'
          ? `<button type="button" class="link-button" data-action="cancel"
               data-id="${escapeHtml(event.id)}" data-reg-id="${escapeHtml(reg.id)}">Cancel</button>`
          : '';
      return `
        <li>
          <span>${escapeHtml(reg.name)} (${escapeHtml(reg.studentId)})</span>
          <span class="${statusClass}">${reg.status}</span>
          ${cancelButton}
        </li>`;
    })
    .join('');
  return `<ul class="reg-list">${items}</ul>`;
}

function renderRegisterForm(event, status) {
  if (status === 'Past' || status === 'Full') {
    return '<p class="muted">Registration is closed for this event.</p>';
  }
  return `
    <form class="register-form" data-event-id="${escapeHtml(event.id)}" novalidate>
      <label>Full name <input name="name" type="text"></label>
      <label>Student ID <input name="studentId" type="text"></label>
      <label>Email <input name="email" type="email"></label>
      <button type="submit" class="btn primary">Register</button>
    </form>`;
}

// ---------- Messages ----------

function showMessage(text, type) {
  messageBox.textContent = text;
  messageBox.className = `toast toast-${type}`;
  messageBox.hidden = false;
  window.clearTimeout(messageTimer);
  messageTimer = window.setTimeout(() => {
    messageBox.hidden = true;
  }, 4000);
}

function showFieldErrors(errors) {
  EVENT_FIELDS.forEach((field) => {
    const message = errors[field] || '';
    document.getElementById(`error-${field}`).textContent = message;
    eventForm.elements[field].setAttribute('aria-invalid', String(Boolean(message)));
  });
}

// ---------- Actions ----------

// Save the new list, then redraw the page.
function commit(nextList) {
  events = nextList;
  saveEvents(events);
  renderAll();
}

function resetEventForm() {
  eventForm.reset();
  editingId = null;
  formHeading.textContent = 'Add an event';
  saveButton.textContent = 'Add event';
  cancelEditButton.hidden = true;
  showFieldErrors({});
}

function startEditing(id) {
  const event = events.find((item) => item.id === id);
  if (!event) return;

  editingId = id;
  EVENT_FIELDS.forEach((field) => {
    eventForm.elements[field].value = event[field];
  });
  formHeading.textContent = 'Edit event';
  saveButton.textContent = 'Save changes';
  cancelEditButton.hidden = false;
  showFieldErrors({});
  eventForm.scrollIntoView({ behavior: 'smooth' });
  eventForm.elements.title.focus();
}

function removeEvent(id) {
  const event = events.find((item) => item.id === id);
  if (!event) return;
  if (!window.confirm(`Delete "${event.title}" and all its registrations?`)) return;

  if (editingId === id) resetEventForm();
  commit(deleteEvent(events, id));
  showMessage('Event deleted.', 'success');
}

function registerStudent(eventId, form) {
  const event = events.find((item) => item.id === eventId);
  if (!event) return;

  const input = readRegisterForm(form);
  const errors = validateRegistration(event, input);
  if (Object.keys(errors).length > 0) {
    showMessage(Object.values(errors).join(' '), 'error');
    return;
  }
  commit(addRegistration(events, eventId, input));
  showMessage(`${input.name.trim()} is registered. Status: Confirmed.`, 'success');
}

function cancelStudent(eventId, regId) {
  commit(cancelRegistration(events, eventId, regId));
  showMessage('Registration cancelled.', 'success');
}

// ---------- Event listeners ----------

eventForm.addEventListener('submit', (submitEvent) => {
  submitEvent.preventDefault();

  const input = readEventForm(eventForm);
  const errors = validateEvent(input);
  showFieldErrors(errors);
  if (Object.keys(errors).length > 0) {
    showMessage('Please fix the highlighted fields.', 'error');
    return;
  }

  if (editingId) {
    commit(updateEvent(events, editingId, input));
    showMessage('Event updated.', 'success');
  } else {
    commit(addEvent(events, input));
    showMessage('Event added.', 'success');
  }
  resetEventForm();
});

cancelEditButton.addEventListener('click', resetEventForm);

// One listener on the list handles every Edit, Delete, Cancel and Register click.
// This is called "event delegation".
eventList.addEventListener('click', (clickEvent) => {
  const button = clickEvent.target.closest('button[data-action]');
  if (!button) return;

  const { action, id, regId } = button.dataset;
  if (action === 'edit') startEditing(id);
  if (action === 'delete') removeEvent(id);
  if (action === 'cancel') cancelStudent(id, regId);
});

eventList.addEventListener('submit', (submitEvent) => {
  const form = submitEvent.target;
  if (!form.classList.contains('register-form')) return;

  submitEvent.preventDefault();
  registerStudent(form.dataset.eventId, form);
});

searchInput.addEventListener('input', renderAll);
categoryFilter.addEventListener('change', renderAll);
statusFilter.addEventListener('change', renderAll);

// ---------- Start ----------

events = loadEvents();
renderAll();

// ========================
// About Modal Logic
// ========================

/**
 * Open the About modal dialog.
 * Used from a button in the footer to show project info.
 */
function openAbout() {
  const modal = document.getElementById('about-modal');
  modal.hidden = false;
  modal.querySelector('.modal-backdrop').focus(); // Accessible focus trap target
}

/**
 * Close the About modal dialog.
 * Called when clicking backdrop, close button, or 'Got it'.
 */
function closeAbout() {
  const modal = document.getElementById('about-modal');
  modal.hidden = true;
}

/**
 * Attach event listeners for the About modal.
 * Uses event delegation on document to keep handlers minimal.
 */
function bindAboutListeners() {
  // Close on backdrop click or escape key
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !document.getElementById('about-modal').hidden) {
      closeAbout();
    }
  });

  // Bind clicks to modal elements (added at end of HTML body)
  const modal = document.getElementById('about-modal');
  const backdrop = modal.querySelector('.modal-backdrop');
  const closeBtn = modal.querySelector('#close-about');
  const saveBtn = modal.querySelector('#save-about');

  backdrop.addEventListener('click', closeAbout);
  closeBtn.addEventListener('click', closeAbout);
  saveBtn.addEventListener('click', closeAbout);
}

// Initialize About modal listeners after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindAboutListeners);
} else {
  bindAboutListeners();
}
