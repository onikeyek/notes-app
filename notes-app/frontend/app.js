const API = CONFIG.API_URL;

const titleInput = document.getElementById('note-title');
const contentInput = document.getElementById('note-content');
const addBtn = document.getElementById('add-btn');
const notesList = document.getElementById('notes-list');
const noteCount = document.getElementById('note-count');

// Fetch and render all notes
async function loadNotes() {
  try {
    const res = await fetch(`${API}/notes`);
    const notes = await res.json();
    renderNotes(notes);
  } catch (err) {
    notesList.innerHTML = '<p class="empty-state">Could not connect to server.</p>';
  }
}

function renderNotes(notes) {
  noteCount.textContent = `${notes.length} Note${notes.length !== 1 ? 's' : ''}`;

  if (notes.length === 0) {
    notesList.innerHTML = '<p class="empty-state">No notes yet. Add one above.</p>';
    return;
  }

  notesList.innerHTML = notes.map(note => `
    <div class="note-card" data-id="${note.id}">
      <button class="delete-btn" onclick="deleteNote(${note.id})" title="Delete note">✕</button>
      <h3>${escapeHtml(note.title)}</h3>
      ${note.content ? `<p>${escapeHtml(note.content)}</p>` : ''}
      <div class="meta">${timeAgo(note.created_at)}</div>
    </div>
  `).join('');
}

// Add a note
addBtn.addEventListener('click', async () => {
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();
  if (!title) {
    titleInput.focus();
    titleInput.style.borderBottom = '2px solid #e74c3c';
    return;
  }
  titleInput.style.borderBottom = '';

  try {
    await fetch(`${API}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    });
    titleInput.value = '';
    contentInput.value = '';
    loadNotes();
  } catch (err) {
    alert('Failed to add note. Is the server running?');
  }
});

// Delete a note
async function deleteNote(id) {
  try {
    await fetch(`${API}/notes/${id}`, { method: 'DELETE' });
    loadNotes();
  } catch (err) {
    alert('Failed to delete note.');
  }
}

// Helpers
function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

// Init
loadNotes();
