document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('mood-form');
  const moodNote = document.getElementById('mood-note');
  const moodSummary = document.getElementById('mood-summary');
  const history = document.getElementById('mood-history');
  const buttons = Array.from(document.querySelectorAll('.mood-option'));
  let selectedMood = '';

  function loadEntries() {
    return JSON.parse(localStorage.getItem('habitflow-mood-log') || '[]');
  }

  function saveEntries(entries) {
    localStorage.setItem('habitflow-mood-log', JSON.stringify(entries));
  }

  function renderEntries(entries) {
    if (!entries.length) {
      history.innerHTML = '<div class="history-item"><span>No entries yet</span><span>Start tracking</span></div>';
      return;
    }

    history.innerHTML = entries.slice().reverse().map((entry) => `
      <div class="history-item">
        <span><strong>${entry.mood}</strong> — ${entry.note || 'No note'}</span>
        <span>${entry.date}</span>
      </div>
    `).join('');
  }

  function renderSummary(entries) {
    const latest = entries[entries.length - 1];
    if (!latest) {
      moodSummary.innerHTML = 'No mood logged yet — your check-in is ready.';
      return;
    }

    moodSummary.innerHTML = `<span class="mood-pill">${latest.mood}</span> <span>${latest.note || 'Logged successfully.'}</span>`;
  }

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      selectedMood = button.dataset.mood;
      buttons.forEach((item) => item.classList.toggle('active', item === button));
      button.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  });

  const entries = loadEntries();
  renderEntries(entries);
  renderSummary(entries);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!selectedMood) {
      if (window.showToast) { window.showToast('Choose a mood', 'Pick how you feel before saving.', 'error'); }
      return;
    }

    const entry = {
      mood: selectedMood,
      note: moodNote.value.trim(),
      date: new Date().toLocaleDateString()
    };

    const nextEntries = [...loadEntries(), entry];
    saveEntries(nextEntries);
    renderEntries(nextEntries);
    renderSummary(nextEntries);
    moodNote.value = '';
    selectedMood = '';
    buttons.forEach((button) => button.classList.remove('active'));
    if (window.showToast) {
      window.showToast('Mood saved', 'Your wellness note is now in your history.', 'success');
    }
  });
});
