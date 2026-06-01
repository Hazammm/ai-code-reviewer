let currentReview = "";

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2500);
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast("Copied to clipboard!");
  });
}

function loadExample() {
  const examples = {
    "Python": `def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n\nprint(fibonacci(35))`,
    "JavaScript": `function processData(data) {\n    return data.map(item => item.value * 2);\n}`,
  };
  
  document.getElementById('code-input').value = examples["Python"];
  document.getElementById('language').value = "Python";
  showToast("Example loaded!");
}

async function submitReview() {
  const code = document.getElementById('code-input').value.trim();
  const language = document.getElementById('language').value;
  const focus = document.getElementById('focus').value;
  const btn = document.getElementById('review-btn');
  const btnText = document.getElementById('btn-text');
  const loading = document.getElementById('loading');

  if (!code) {
    showToast("Please paste some code first!");
    return;
  }

  // UI Loading State
  btn.disabled = true;
  btnText.classList.add('hidden');
  loading.classList.remove('hidden');

  try {
    const response = await fetch('/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language, focus })
    });

    const data = await response.json();

    if (data.error) throw new Error(data.error);

    currentReview = data.review;

    // Display Result
    document.getElementById('result-panel').style.display = 'flex';
    document.getElementById('review-content').innerHTML = marked.parse ? marked.parse(data.review) : data.review;
    
    document.getElementById('model-info').textContent = `Model: ${data.model}`;
    document.getElementById('token-info').textContent = `Tokens: ${data.tokens}`;

    // Highlight code blocks
    hljs.highlightAll();

  } catch (err) {
    showToast("Error: " + err.message);
  } finally {
    btn.disabled = false;
    btnText.classList.remove('hidden');
    loading.classList.add('hidden');
  }
}

function copyReview() {
  if (currentReview) copyToClipboard(currentReview);
}

function clearReview() {
  document.getElementById('result-panel').style.display = 'none';
  document.getElementById('code-input').value = '';
}

// Allow Ctrl/Cmd + Enter to submit
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    submitReview();
  }
});
