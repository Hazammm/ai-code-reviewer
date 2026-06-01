let currentReview = "";

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2500);
}

function loadExample() {
  document.getElementById('code-input').value = `def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n\nprint(fibonacci(35))`;
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

  btn.disabled = true;
  btnText.classList.add('hidden');
  loading.classList.remove('hidden');

  try {
    const res = await fetch('/review', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({code, language, focus})
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error);

    currentReview = data.review;
    document.getElementById('result-panel').style.display = 'flex';
    document.getElementById('review-content').innerHTML = data.review.replace(/\n/g, '<br>');
    
    document.getElementById('model-info').textContent = `Model: ${data.model}`;
    document.getElementById('token-info').textContent = `Tokens: ${data.tokens}`;

  } catch (err) {
    showToast("Error: " + err.message);
  } finally {
    btn.disabled = false;
    btnText.classList.remove('hidden');
    loading.classList.add('hidden');
  }
}

function copyReview() {
  if (currentReview) {
    navigator.clipboard.writeText(currentReview);
    showToast("Review copied!");
  }
}

function clearReview() {
  document.getElementById('result-panel').style.display = 'none';
  document.getElementById('code-input').value = '';
}