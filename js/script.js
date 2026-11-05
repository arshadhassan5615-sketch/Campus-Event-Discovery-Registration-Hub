// script.js - Application logic (CSE326 beginner-friendly structure)

// --- State & Elements ---
let events = [];
let currentEditId = null;

const els = {
  eventsGrid: document.getElementById('eventsGrid'),
  searchInput: document.getElementById('searchInput'),
  categoryFilter: document.getElementById('categoryFilter'),
  refreshBtn: document.getElementById('refreshBtn'),
  eventForm: document.getElementById('eventForm'),
  modalTitle: document.getElementById('modalTitle'),
  successModal: document.getElementById('successModal'),
  successMessage: document.getElementById('successMessage'),
  dashboardContent: document.getElementById('dashboard-content'),
  stats: {
    total: document.getElementById('stat-total'),
    upcoming: document.getElementById('stat-upcoming'),
    registrations: document.getElementById('stat-registrations'),
    seats: document.getElementById('stat-seats')
  }
};

// --- Core Functions ---

function loadEvents() {
  // In production: fetch from API here
  events = JSON.parse(localStorage.getItem('campusEvents') || '[]');
  render();
}

function saveEvents() {
  localStorage.setItem('campusEvents', JSON.stringify(events));
  render();
}

function render() {
  renderEvents();
  updateDashboard();
}

// --- Event List Rendering ---

function renderEvents() {
  const query = els.searchInput.value.toLowerCase();
  const filterCat = els.categoryFilter.value;

  const filtered = events.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(query) ||
                         e.description.toLowerCase().includes(query) ||
                         e.venue.toLowerCase().includes(query);
    const matchesCat = filterCat === 'all' || e.category === filterCat;
    return matchesSearch && matchesCat;
  });

  els.eventsGrid.innerHTML = filtered.length === 0
    ? `<div class="empty">No events found matching your criteria.</div>`
    : filtered.map(e => createEventCard(e)).join('');
}

function createEventCard(event) {
  const status = computeStatus(event);
  const capacityPercent = Math.round((event.registered / event.capacity) * 100);

  return `
    <div class="event-card" data-id="${event.id}">
      <span class="category-badge">${getCategoryLabel(event.category)}</span>
      <span class="status-badge status-${status}">${status}</span>
      <h3>${escapeHtml(event.title)}</h3>
      <div class="event-meta">
        <span>📍 ${escapeHtml(event.venue)}</span>
        <span>📅 ${formatDate(event.date, event.time)}</span>
      </div>
      <p>${escapeHtml(event.description)}</p>
      <div class="event-footer">
        <span class="seats">${event.registered}/${event.capacity} registered (${capacityPercent}%)</span>
        <button 
          class="btn-register" 
          onclick="openRegisterModal(${event.id})"
          ${event.registered >= event.capacity ? 'disabled' : ''}
        >
          ${event.registered >= event.capacity ? 'Full' : 'Register'}
        </button>
      </div>
    </div>
  `;
}

function computeStatus(event) {
  const now = new Date();
  const eventDate = new Date(`${event.date}T${event.time || '00:00'}`);
  if (eventDate < now) return 'past';
  if (event.registered >= event.capacity) return 'full';
  if (event.registered >= event.capacity - 5) return 'almost';
  return 'open';
}

function getCategoryLabel(cat) {
  const map = {
    workshops: '🛠️ Workshop',
    competitions: '🏆 Competition',
    talks: '🎤 Talk',
    clubs: '🎉 Club Event'
  };
  return map[cat] || cat;
}

function formatDate(date, time) {
  if (!date) return '';
  const d = new Date(date);
  return `${d.toLocaleDateString()} ${time || ''}`.trim();
}

// --- Dashboard ---

function updateDashboard() {
  const total = events.length;
  const upcoming = events.filter(e => {
    const now = new Date();
    const eventDate = new Date(`${e.date}T${e.time || '00:00'}`);
    return eventDate >= now && e.registered < e.capacity;
  }).length;
  const totalRegs = events.reduce((sum, e) => sum + e.registered, 0);
  const seatsLeft = events.filter(e => e.registered < e.capacity)
    .reduce((sum, e) => sum + (e.capacity - e.registered), 0);

  els.dashboardContent.innerHTML = total === 0
    ? `<p>No events registered yet.</p>`
    : `
      <div style="display:grid; gap:0.5rem;">
        <div><strong>Total events:</strong> ${total}</div>
        <div><strong>Upcoming:</strong> ${upcoming}</div>
        <div><strong>Total registrations:</strong> ${totalRegs}</div>
        <div><strong>Seats remaining:</strong> ${seatsLeft}</div>
      </div>
    `;

  // Update stat boxes
  els.stats.total.textContent = total;
  els.stats.upcoming.textContent = upcoming;
  els.stats.registrations.textContent = totalRegs;
  els.stats.seats.textContent = seatsLeft;
}

// --- Registration Modal ---

window.openRegisterModal = function(id) {
  const event = events.find(e => e.id === id);
  if (!event) return;

  const confirmed = confirm(
    `Register for "${event.title}"?\n\n` +
    `Capacity: ${event.registered}/${event.capacity} (${Math.round((event.registered/event.capacity)*100)}%)`
  );

  if (!confirmed) return;

  if (event.registered >= event.capacity) {
    alert('Event is now full!');
    return;
  }

  event.registered++;
  saveEvents();
  showSuccessToast(`Registered for "${event.title}" successfully!`);
};

// --- Event Form (Add/Edit) ---

els.eventForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = {
    title: document.getElementById('eventTitle').value.trim(),
    category: document.getElementById('eventCategory').value,
    location: document.getElementById('eventLocation').value.trim(),
    capacity: parseInt(document.getElementById('eventCapacity').value, 10),
    registered: parseInt(document.getElementById('registeredCount').value, 10) || 0,
    date: document.getElementById('eventDate').value,
    time: document.getElementById('eventDate').value ? 
      document.getElementById('eventDate').value.split('T')[1].slice(0, 5) : '',
    description: document.getElementById('eventDescription').value.trim()
  };

  // Basic validation
  if (!formData.title || !formData.category || !formData.date || formData.capacity <= 0) {
    showToast('Please fill all required fields correctly.', 'error');
    return;
  }

  if (currentEditId) {
    const index = events.findIndex(e => e.id === currentEditId);
    if (index !== -1) {
      events[index] = { ...events[index], ...formData };
      showToast('Event updated successfully!', 'success');
    }
  } else {
    const newEvent = {
      id: Date.now(),
      ...formData
    };
    events.unshift(newEvent);
    showToast('Event added successfully!', 'success');
  }

  saveEvents();
  closeModal('eventModal');
  els.eventForm.reset();
});

// --- Search & Filters ---

els.searchInput.addEventListener('input', render);
els.categoryFilter.addEventListener('change', render);
els.refreshBtn.addEventListener('click', () => {
  loadEvents();
  showToast('Events refreshed', 'success');
});

// --- Modals & Toasts ---

window.closeModal = function(id) {
  document.getElementById(id).classList.add('hidden');
};

window.openSuccessModal = function(message) {
  els.successMessage.textContent = message;
  els.successModal.classList.remove('hidden');
};

function showToast(message, type = 'success') {
  const toast = document.getElementById('message');
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast show ${type === 'success' ? 'success' : 'error'}`;
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

function showSuccessToast(message) {
  showToast(message, 'success');
  // Also show modal for clarity
  openSuccessModal(message);
}

// --- Initialize ---

document.addEventListener('DOMContentLoaded', loadEvents);

// Helper: escape HTML to prevent XSS
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
