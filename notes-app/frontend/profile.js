const API = CONFIG.API_URL;

document.addEventListener('DOMContentLoaded', async () => {

  // Load total notes count from backend
  try {
    const res = await fetch(`${API}/notes`);
    const notes = await res.json();
    const el = document.getElementById('profile-total-notes');
    if (el) el.textContent = notes.length;
  } catch {
    console.warn('Could not load notes count');
  }

  // Dark mode toggle (synced with preference toggle)
  const prefDark = document.getElementById('pref-dark');
  const topbarToggle = document.getElementById('toggle-theme');

  // Load saved preferences
  const savedDark = localStorage.getItem('darkMode') === 'true';
  if (savedDark) {
    document.body.classList.add('dark');
    if (prefDark) prefDark.checked = true;
  }

  if (prefDark) {
    prefDark.addEventListener('change', () => {
      document.body.classList.toggle('dark', prefDark.checked);
      localStorage.setItem('darkMode', prefDark.checked);
    });
  }

  if (topbarToggle) {
    topbarToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark');
      const isDark = document.body.classList.contains('dark');
      topbarToggle.textContent = isDark ? '☀️' : '🌙';
      if (prefDark) prefDark.checked = isDark;
      localStorage.setItem('darkMode', isDark);
    });
  }

  // Save profile settings
  const saveBtn = document.getElementById('save-settings-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const name      = document.getElementById('profile-name').value.trim();
      const email     = document.getElementById('profile-email').value.trim();
      const workspace = document.getElementById('profile-workspace').value.trim();

      localStorage.setItem('profile_name', name);
      localStorage.setItem('profile_email', email);
      localStorage.setItem('profile_workspace', workspace);

      saveBtn.textContent = '✓ Saved';
      setTimeout(() => saveBtn.textContent = 'Save Changes', 2000);
    });
  }

  // Load saved profile settings
  const savedName = localStorage.getItem('profile_name');
  const savedEmail = localStorage.getItem('profile_email');
  const savedWorkspace = localStorage.getItem('profile_workspace');
  if (savedName)      document.getElementById('profile-name').value = savedName;
  if (savedEmail)     document.getElementById('profile-email').value = savedEmail;
  if (savedWorkspace) document.getElementById('profile-workspace').value = savedWorkspace;

  // Save preference toggles to localStorage
  ['pref-email', 'pref-desktop', 'pref-score'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const saved = localStorage.getItem(id);
    if (saved !== null) el.checked = saved === 'true';
    el.addEventListener('change', () => localStorage.setItem(id, el.checked));
  });

});
