const API = CONFIG.API_URL;

// State
let allNotes     = [];
let activeFilter = 'all';
let activeSort   = 'newest';
let selectedTag  = 'work';
let selectedMood = '😊';
let currentNoteId = null;

document.addEventListener('DOMContentLoaded', () => {

  // Elements — dashboard
  const notesGrid    = document.getElementById('notes-grid');
  const noteCount    = document.getElementById('note-count');
  const searchInput  = document.getElementById('search-input');
  const toggleTheme  = document.getElementById('toggle-theme');

  // Elements — compose modal
  const modalOverlay   = document.getElementById('modal-overlay');
  const openCompose    = document.getElementById('open-compose');
  const closeModalBtn  = document.getElementById('close-modal');
  const saveNoteBtn    = document.getElementById('save-note');
  const noteTitleEl    = document.getElementById('note-title');
  const noteContentEl  = document.getElementById('note-content');

  // Elements — edit modal
  const editModalOverlay  = document.getElementById('edit-modal-overlay');
  const closeEditModalBtn = document.getElementById('close-edit-modal');
  const editTitleEl       = document.getElementById('edit-note-title');
  const editContentEl     = document.getElementById('edit-note-content');
  const updateNoteBtn     = document.getElementById('update-note-btn');
  let editSelectedTag  = 'work';
  let editSelectedMood = '😊';
  const detailView      = document.getElementById('detail-view');
  const backBtn         = document.getElementById('back-btn');
  const detailTitle     = document.getElementById('detail-title');
  const detailContent   = document.getElementById('detail-content');
  const detailImageWrap = document.getElementById('detail-image-wrap');
  const detailImage     = document.getElementById('detail-image');
  const detailTagMood   = document.getElementById('detail-tag-mood');
  const dmCreated       = document.getElementById('dm-created');
  const dmWords         = document.getElementById('dm-words');
  const dmRead          = document.getElementById('dm-read');
  const deleteDetailBtn = document.getElementById('delete-detail-btn');
  const detailEditBtn   = document.getElementById('detail-edit-btn');

  // ── Load & Render ──────────────────────────────────────
  async function loadNotes() {
    try {
      const res = await fetch(`${API}/notes`);
      allNotes = await res.json();
      renderNotes();
    } catch {
      notesGrid.innerHTML = '<p class="empty-state">Could not connect to server.</p>';
    }
  }

  function renderNotes() {
    let notes = [...allNotes];

    if (activeFilter !== 'all') {
      notes = notes.filter(n =>
        (n.title || '').toLowerCase().startsWith(`[${activeFilter}]`)
      );
    }

    const q = searchInput.value.trim().toLowerCase();
    if (q) {
      notes = notes.filter(n =>
        n.title.toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q)
      );
    }

    if (activeSort === 'az') {
      notes.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      notes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    noteCount.textContent = `${allNotes.length} note${allNotes.length !== 1 ? 's' : ''}`;

    const statTotal = document.getElementById('stat-total');
    const statToday = document.getElementById('stat-today');
    if (statTotal) statTotal.textContent = allNotes.length;
    if (statToday) {
      const today = new Date().toDateString();
      statToday.textContent = allNotes.filter(n =>
        new Date(n.created_at).toDateString() === today
      ).length;
    }

    if (notes.length === 0) {
      notesGrid.innerHTML = '<p class="empty-state">No notes found.</p>';
      return;
    }

    notesGrid.innerHTML = notes.map(note => {
      const tag  = extractTag(note.title);
      const mood = extractMood(note.title);
      return `
        <div class="note-card" onclick="openNote(${note.id})">
          <div class="card-actions">
            <button class="del-btn" onclick="event.stopPropagation(); handleDelete(${note.id})">🗑</button>
          </div>
          ${note.image_url ? `<img src="${note.image_url}" class="card-img" alt="note image" />` : ''}
          ${mood ? `<span class="card-mood">${mood}</span>` : ''}
          ${tag ? `<span class="card-tag tag-${tag}">${tag}</span>` : ''}
          <h3>${escapeHtml(cleanTitle(note.title))}</h3>
          ${note.content ? `<p>${escapeHtml(note.content)}</p>` : ''}
          <div class="meta">${formatDate(note.created_at)}</div>
        </div>
      `;
    }).join('');
  }

  // ── Note Detail ────────────────────────────────────────
  window.openNote = function(id) {
    const note = allNotes.find(n => n.id == id);
    if (!note) return;
    currentNoteId = note.id;

    const tag   = extractTag(note.title);
    const mood  = extractMood(note.title);
    const words = note.content ? note.content.trim().split(/\s+/).filter(Boolean).length : 0;
    const readMins = Math.max(1, Math.ceil(words / 200));

    detailTitle.textContent   = cleanTitle(note.title);
    detailContent.textContent = note.content || '';
    detailTagMood.innerHTML   = `
      ${tag  ? `<span class="card-tag tag-${tag}">${tag}</span>` : ''}
      ${mood ? `<span style="font-size:1.3rem">${mood}</span>` : ''}
    `;

    if (note.image_url) {
      detailImage.src = note.image_url;
      detailImageWrap.style.display = 'block';
    } else {
      detailImageWrap.style.display = 'none';
    }

    dmCreated.textContent = formatDate(note.created_at);
    dmWords.textContent   = `${words} words`;
    dmRead.textContent    = `${readMins} min`;

    detailView.style.display = 'flex';
  };

  backBtn.addEventListener('click', () => {
    detailView.style.display = 'none';
    currentNoteId = null;
  });

  detailEditBtn.addEventListener('click', () => {
    const note = allNotes.find(n => n.id == currentNoteId);
    if (note) openEditModal(note);
  });

  deleteDetailBtn.addEventListener('click', async () => {
    if (!currentNoteId) return;
    await handleDelete(currentNoteId);
    detailView.style.display = 'none';
    currentNoteId = null;
  });

  // ── Delete ─────────────────────────────────────────────
  window.handleDelete = async function(id) {
    try {
      await fetch(`${API}/notes/${id}`, { method: 'DELETE' });
      loadNotes();
    } catch {
      alert('Failed to delete note.');
    }
  };

  // ── Save Note ──────────────────────────────────────────
  saveNoteBtn.addEventListener('click', async () => {
    const rawTitle = noteTitleEl.value.trim();
    const content  = noteContentEl.value.trim();
    if (!rawTitle) { noteTitleEl.focus(); return; }

    const title = `[${selectedTag}] ${rawTitle} ${selectedMood}`;

    try {
      await fetch(`${API}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });
      noteTitleEl.value = '';
      noteContentEl.value = '';
      modalOverlay.classList.remove('open');
      loadNotes();
    } catch {
      alert('Failed to save note.');
    }
  });

  // ── Edit Modal ─────────────────────────────────────────
  function openEditModal(note) {
    const tag  = extractTag(note.title);
    const mood = extractMood(note.title);

    editTitleEl.value   = cleanTitle(note.title);
    editContentEl.value = note.content || '';
    editSelectedTag     = tag || 'work';
    editSelectedMood    = mood || '😊';

    // Set active tag chip
    document.querySelectorAll('#edit-tag-chips .tag-chip').forEach(c => {
      c.classList.toggle('active', c.dataset.tag === editSelectedTag);
    });

    // Set active mood
    document.querySelectorAll('#edit-mood-picker .mood-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.mood === editSelectedMood);
    });

    editModalOverlay.classList.add('open');
  }

  closeEditModalBtn.addEventListener('click', () => editModalOverlay.classList.remove('open'));
  editModalOverlay.addEventListener('click', e => {
    if (e.target === editModalOverlay) editModalOverlay.classList.remove('open');
  });

  document.querySelectorAll('#edit-tag-chips .tag-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#edit-tag-chips .tag-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      editSelectedTag = chip.dataset.tag;
    });
  });

  document.querySelectorAll('#edit-mood-picker .mood-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#edit-mood-picker .mood-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      editSelectedMood = btn.dataset.mood;
    });
  });

  updateNoteBtn.addEventListener('click', async () => {
    const rawTitle = editTitleEl.value.trim();
    const content  = editContentEl.value.trim();
    if (!rawTitle) { editTitleEl.focus(); return; }

    const title = `[${editSelectedTag}] ${rawTitle} ${editSelectedMood}`;

    try {
      await fetch(`${API}/notes/${currentNoteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });
      editModalOverlay.classList.remove('open');
      detailView.style.display = 'none';
      currentNoteId = null;
      loadNotes();
    } catch {
      alert('Failed to update note.');
    }
  });

  // ── Modal ──────────────────────────────────────────────
  openCompose.addEventListener('click', () => modalOverlay.classList.add('open'));
  closeModalBtn.addEventListener('click', () => modalOverlay.classList.remove('open'));
  modalOverlay.addEventListener('click', e => {
    if (e.target === modalOverlay) modalOverlay.classList.remove('open');
  });

  // ── Mood picker ────────────────────────────────────────
  document.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedMood = btn.dataset.mood;
    });
  });

  // ── Tag chips ──────────────────────────────────────────
  document.querySelectorAll('.tag-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.tag-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      selectedTag = chip.dataset.tag;
    });
  });

  // ── Sidebar nav ────────────────────────────────────────
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      activeFilter = item.dataset.filter;
      renderNotes();
    });
  });

  // ── Popular tags ───────────────────────────────────────
  document.querySelectorAll('.pop-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      const filter = tag.textContent.replace('#', '').trim();
      activeFilter = filter;
      document.querySelectorAll('.nav-item').forEach(i => {
        i.classList.toggle('active', i.dataset.filter === filter);
      });
      renderNotes();
    });
  });

  // ── Sort ───────────────────────────────────────────────
  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeSort = btn.dataset.sort;
      renderNotes();
    });
  });

  // ── Search ─────────────────────────────────────────────
  searchInput.addEventListener('input', renderNotes);

  // ── Dark mode ──────────────────────────────────────────
  toggleTheme.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    toggleTheme.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
  });

  // ── Init ───────────────────────────────────────────────
  loadNotes();
});

// ── Helpers ────────────────────────────────────────────
function extractTag(title) {
  const match = title.match(/^\[(\w+)\]/i);
  return match ? match[1].toLowerCase() : null;
}

function extractMood(title) {
  const match = title.match(/([\u{1F300}-\u{1FAFF}])/u);
  return match ? match[1] : null;
}

function cleanTitle(title) {
  return title.replace(/^\[\w+\]\s*/i, '').replace(/([\u{1F300}-\u{1FAFF}])/gu, '').trim();
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
