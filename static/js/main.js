const input = document.getElementById('code-input');
const charCount = document.getElementById('char-count');

// Character counter
input.addEventListener('input', () => {
  const len = input.value.length;
  charCount.textContent = `${len.toLocaleString()} / 10,000`;
  charCount.className = 'char-count' +
    (len > 9000 ? ' danger' : len > 7000 ? ' warn' : '');
});

// Tab key support inside textarea
input.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const s = input.selectionStart;
    const end = input.selectionEnd;
    input.value = input.value.substring(0, s) + '  ' + input.value.substring(end);
    input.selectionStart = input.selectionEnd = s + 2;
  }
});

async function reviewCode() {
  const code = input.value.trim();
  if (!code) { alert('Please paste some code first!'); return; }

  const btn = document.getElementById('review-btn');
  const output = document.getElementById('output');
  const statusBadge = document.getElementById('status-badge');
  const statsBar = document.getElementById('stats-bar');

  // Loading state
  btn.disabled = true;
  btn.className = 'review-btn loading';
  btn.innerHTML = '<span class="spinner"></span> Analyzing...';
  statusBadge.textContent = 'Reviewing';
  statsBar.style.display = 'none';
  output.innerHTML = '<div class="placeholder-msg"><div class="icon">⬡</div><p>Claude is reviewing your code...</p></div>';

  const startTime = Date.now();

  try {
    const res = await fetch('/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        language: document.getElementById('language').value,
        focus: document.getElementById('focus').value
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Server error');
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    // Render markdown
    output.innerHTML = marked.parse(data.review);

    // Syntax highlight code blocks
    output.querySelectorAll('pre code').forEach(el => hljs.highlightElement(el));

    // Show stats
    document.getElementById('stat-tokens').textContent = data.tokens_used?.toLocaleString() ?? '—';
    document.getElementById('stat-time').textContent = `${elapsed}s`;
    statsBar.style.display = 'flex';
    statusBadge.textContent = 'Done ✓';

  } catch (err) {
    output.innerHTML = `<div class="error-msg">⚠ ${err.message}</div>`;
    statusBadge.textContent = 'Error';
  } finally {
    btn.disabled = false;
    btn.className = 'review-btn';
    btn.innerHTML = '✦ Review My Code';
  }
}
