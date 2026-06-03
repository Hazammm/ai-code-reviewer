// Global State
let inputEditor = null;
let diffEditor = null;
let originalModel = null;
let modifiedModels = [null, null, null, null]; // 0: Original, 1: Phase 1, 2: Phase 2, 3: Phase 3
let codePhases = ["", "", "", ""]; // Code strings
let pyodideInstance = null;
let pyodideLoading = false;
let currentReviewMarkdown = "";

// Language Mappings for Monaco
const MONACO_LANG_MAP = {
  "Auto-detect": "python",
  "Python": "python",
  "JavaScript": "javascript",
  "TypeScript": "typescript",
  "Java": "java",
  "C++": "cpp",
  "C": "c",
  "Go": "go",
  "Rust": "rust",
  "PHP": "php",
  "SQL": "sql",
  "Bash": "shell",
  "HTML": "html",
  "CSS": "css"
};

// Monaco Loader
require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } });
require(['vs/editor/editor.main'], function () {
  // Set theme colors to match glassmorphism palette
  monaco.editor.defineTheme('codelens-theme', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '7f8c8d', fontStyle: 'italic' },
      { token: 'keyword', foreground: '00ff9d', fontStyle: 'bold' },
      { token: 'string', foreground: '00e5ff' },
      { token: 'number', foreground: '9d4edd' }
    ],
    colors: {
      'editor.background': '#0c0c11',
      'editor.lineHighlightBackground': '#161622',
      'editorCursor.foreground': '#00ff9d',
      'editor.selectionBackground': '#2c2c3e'
    }
  });

  // Initialize Input Editor
  inputEditor = monaco.editor.create(document.getElementById('monaco-input-editor'), {
    value: `def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n\nprint(fibonacci(10))`,
    language: 'python',
    theme: 'codelens-theme',
    automaticLayout: true,
    fontSize: 14,
    fontFamily: "'Fira Code', Consolas, monospace",
    minimap: { enabled: false },
    roundedSelection: true,
    scrollbar: {
      verticalScrollbarSize: 8,
      horizontalScrollbarSize: 8
    }
  });

  // Initialize Diff Editor
  diffEditor = monaco.editor.createDiffEditor(document.getElementById('monaco-diff-editor'), {
    theme: 'codelens-theme',
    automaticLayout: true,
    fontSize: 13,
    fontFamily: "'Fira Code', Consolas, monospace",
    renderSideBySide: true,
    readOnly: true,
    minimap: { enabled: false }
  });

  // Setup marked option for highlight.js syntax highlighting
  marked.setOptions({
    highlight: function (code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    },
    langPrefix: 'hljs language-'
  });

  showToast("CodeLens Environment Loaded!");
});

// Toast messaging utility
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  toast.style.opacity = '1';
  toast.style.transform = 'translateY(0)';
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.classList.add('hidden'), 300);
  }, 3500);
}

// Switch Monaco language model
function changeEditorLanguage() {
  if (!inputEditor) return;
  const langVal = document.getElementById('language').value;
  const monacoLang = MONACO_LANG_MAP[langVal] || "plaintext";
  const model = inputEditor.getModel();
  monaco.editor.setModelLanguage(model, monacoLang);
}

// Switch between tabs
function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  
  // Find the click target and active content
  const activeBtn = Array.from(document.querySelectorAll('.tab-btn')).find(btn => btn.textContent.toLowerCase().includes(tabId));
  if (activeBtn) activeBtn.classList.add('active');
  
  const contentEl = document.getElementById(`tab-${tabId}`);
  if (contentEl) contentEl.classList.add('active');

  // Trigger Monaco layout refreshes
  if (tabId === 'diff' && diffEditor) {
    diffEditor.layout();
  }
}

// Example code loaders
function loadExample() {
  if (!inputEditor) return;
  inputEditor.setValue(`def factorial(n):
    # Bug: Infinite recursion if n is negative
    # Performance: O(n) space and time complexity can be optimized
    if n == 0:
        return 1
    return n * factorial(n - 1)

print("Factorial of 5:", factorial(5))
`);
  document.getElementById('language').value = "Python";
  changeEditorLanguage();
  showToast("Python Example loaded!");
}

function loadJSExample() {
  if (!inputEditor) return;
  inputEditor.setValue(`function findDuplicates(arr) {
  // Bug: Modifies the parameter directly
  // Performance: O(n^2) search using indexOf inside filter
  let duplicates = arr.filter((item, index) => {
    return arr.indexOf(item) !== index;
  });
  return duplicates;
}

console.log(findDuplicates([1, 2, 3, 2, 4, 5, 1]));
`);
  document.getElementById('language').value = "JavaScript";
  changeEditorLanguage();
  showToast("JavaScript Example loaded!");
}

// Streaming POST request logic
async function submitReview() {
  if (!inputEditor) return;
  const code = inputEditor.getValue().trim();
  const language = document.getElementById('language').value;
  const focus = document.getElementById('focus').value;
  
  const btn = document.getElementById('review-btn');
  const btnIcon = document.getElementById('btn-icon');
  const btnText = document.getElementById('btn-text');
  const loading = document.getElementById('loading');

  if (!code) {
    showToast("Please write or paste code first!");
    return;
  }

  // Toggle button loading states
  btn.disabled = true;
  btnIcon.classList.add('hidden');
  btnText.classList.add('hidden');
  loading.classList.remove('hidden');

  // Clear previous outputs
  document.getElementById('review-content').innerHTML = `
    <div class="empty-state">
      <span class="empty-icon">⚡</span>
      <p>Initiating code review pipeline...</p>
    </div>
  `;
  clearMetrics();
  clearSandbox();

  currentReviewMarkdown = "";
  codePhases = [code, code, code, code]; // Reset phase array with original code

  try {
    const res = await fetch('/review', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({code, language, focus})
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Failed to contact review pipeline");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    switchTab('review');

    while (true) {
      const {done, value} = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, {stream: true});
      const lines = buffer.split("\n\n");
      buffer = lines.pop(); // Hold incomplete chunk

      for (const line of lines) {
        if (line.trim().startsWith("data: ")) {
          try {
            const data = JSON.parse(line.substring(6));
            handleStreamChunk(data);
          } catch (e) {
            console.error("Error parsing SSE chunk:", e);
          }
        }
      }
    }

    // Process leftover buffer
    if (buffer && buffer.trim().startsWith("data: ")) {
      try {
        const data = JSON.parse(buffer.substring(6));
        handleStreamChunk(data);
      } catch (e) {
        console.error("Error parsing SSE leftover chunk:", e);
      }
    }

    // Final XML Extraction parsing
    extractRefactoredPhases();
    setupDiffModels();
    showToast("Analysis & Review complete!");

  } catch (err) {
    showToast("Error: " + err.message);
    document.getElementById('review-content').innerHTML = `
      <div class="empty-state" style="color: var(--accent-error);">
        <span class="empty-icon">⚠️</span>
        <p>An error occurred: ${err.message}</p>
      </div>
    `;
  } finally {
    btn.disabled = false;
    btnIcon.classList.remove('hidden');
    btnText.classList.remove('hidden');
    loading.classList.add('hidden');
  }
}

// Clear dashboard metrics widgets
function clearMetrics() {
  document.getElementById('metric-loc').textContent = '0';
  document.getElementById('metric-lloc').textContent = '0';
  document.getElementById('metric-complexity').textContent = '0';
  document.getElementById('rank-complexity').textContent = 'A';
  document.getElementById('rank-complexity').className = 'metric-rank';
  document.getElementById('metric-mi').textContent = '0';
  document.getElementById('rank-mi').textContent = 'A';
  document.getElementById('rank-mi').className = 'metric-rank';
}

// Clear browser sandbox outputs
function clearSandbox() {
  document.getElementById('console-original').textContent = 'Output logs will display here...';
  document.getElementById('console-refactored').textContent = 'Output logs will display here...';
  document.getElementById('time-original').textContent = '-';
  document.getElementById('time-refactored').textContent = '-';
  document.getElementById('bar-original').style.width = '0%';
  document.getElementById('bar-refactored').style.width = '0%';
  document.getElementById('sandbox-verdict').className = 'sandbox-verdict';
  document.getElementById('sandbox-verdict').textContent = 'Run the benchmark to verify execution speedup and output equivalence.';
}

// Stream chunk processing dispatcher
function handleStreamChunk(data) {
  if (data.type === 'metrics') {
    renderMetrics(data.metrics);
  } else if (data.type === 'content') {
    currentReviewMarkdown += data.delta;
    renderReviewMarkdown(currentReviewMarkdown);
  } else if (data.type === 'tokens') {
    document.getElementById('model-info').textContent = "Claude 3.5 Sonnet";
    document.getElementById('token-info').textContent = `Usage: ${data.input_tokens + data.output_tokens} tokens`;
  } else if (data.type === 'error') {
    throw new Error(data.error);
  }
}

// Render local metrics card values and styling ranks
function renderMetrics(m) {
  document.getElementById('metric-loc').textContent = m.loc;
  document.getElementById('metric-lloc').textContent = m.lloc;
  document.getElementById('metric-complexity').textContent = m.complexity;
  
  const rankComp = document.getElementById('rank-complexity');
  rankComp.textContent = m.complexity_rank;
  rankComp.className = `metric-rank rank-${m.complexity_rank}`;

  document.getElementById('metric-mi').textContent = m.mi;
  const rankMi = document.getElementById('rank-mi');
  rankMi.textContent = m.mi_rank;
  rankMi.className = `metric-rank rank-${m.mi_rank}`;
}

// Safely render the review markdown streaming text, stripping out the raw XML code blocks
function renderReviewMarkdown(markdown) {
  // Strip out any trailing XML refactor tags from the visible review pane
  let displayMarkdown = markdown.replace(/<refactor_phase_[\s\S]*$/, "").trim();
  
  if (!displayMarkdown) {
    document.getElementById('review-content').innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">⏳</span>
        <p>Analysing codebase structures...</p>
      </div>
    `;
    return;
  }

  // Parse Markdown securely
  const htmlContent = DOMPurify.sanitize(marked.parse(displayMarkdown));
  document.getElementById('review-content').innerHTML = htmlContent;
}

// Extract progressive refactoring codes from XML wrappers using regex
function extractRefactoredPhases() {
  const parsePhase = (num) => {
    const regex = new RegExp(`<refactor_phase_${num}[^>]*>([\\s\\S]*?)<\/refactor_phase_${num}>`, 'i');
    const match = currentReviewMarkdown.match(regex);
    return match ? match[1].trim() : "";
  };

  const phase1 = parsePhase(1);
  const phase2 = parsePhase(2);
  const phase3 = parsePhase(3);

  // If phases are output successfully, load them. Otherwise cascade fallbacks
  if (phase1) codePhases[1] = phase1;
  else codePhases[1] = codePhases[0];

  if (phase2) codePhases[2] = phase2;
  else codePhases[2] = codePhases[1];

  if (phase3) codePhases[3] = phase3;
  else codePhases[3] = codePhases[2];
}

// Initialize and bind Monaco TextModels to Diff Editor
function setupDiffModels() {
  if (!diffEditor || !inputEditor) return;

  const monacoLang = MONACO_LANG_MAP[document.getElementById('language').value] || "python";

  // Create Original text model (Left side)
  originalModel = monaco.editor.createModel(codePhases[0], monacoLang);

  // Create progressive text models (Right side)
  modifiedModels[0] = originalModel;
  modifiedModels[1] = monaco.editor.createModel(codePhases[1], monacoLang);
  modifiedModels[2] = monaco.editor.createModel(codePhases[2], monacoLang);
  modifiedModels[3] = monaco.editor.createModel(codePhases[3], monacoLang);

  // Set default diff view to Original vs Phase 1
  diffEditor.setModel({
    original: originalModel,
    modified: modifiedModels[1]
  });

  // Set timeline slider index
  document.getElementById('timeline-slider').value = 1;
  updateSliderUI(1);
}

// Slider timeline UI state handling
function onSliderChange(value) {
  const index = parseInt(value, 10);
  updateSliderUI(index);

  if (!diffEditor || !modifiedModels[index]) return;

  diffEditor.setModel({
    original: originalModel,
    modified: modifiedModels[index]
  });
}

function setSliderStep(index) {
  document.getElementById('timeline-slider').value = index;
  onSliderChange(index);
}

function updateSliderUI(index) {
  document.querySelectorAll('.timeline-step').forEach((el, idx) => {
    if (idx === index) el.classList.add('active');
    else el.classList.remove('active');
  });
}

// Direct "Apply" function
function applySelectedRefactoring() {
  if (!inputEditor) return;
  const index = parseInt(document.getElementById('timeline-slider').value, 10);
  const targetCode = codePhases[index];

  if (!targetCode) {
    showToast("No refactored code available for this step!");
    return;
  }

  inputEditor.setValue(targetCode);
  showToast(`Successfully applied Refactoring Phase ${index}!`);
  switchTab('review');
}

// Load WebAssembly Pyodide runtime dynamically
async function initPyodide() {
  if (pyodideInstance) return true;
  if (pyodideLoading) {
    // Wait for ongoing loading
    while (pyodideLoading) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    return pyodideInstance !== null;
  }

  pyodideLoading = true;
  const statusEl = document.getElementById('sandbox-status-text');
  statusEl.textContent = "Loading Python WebAssembly Environment (Pyodide)...";
  
  try {
    pyodideInstance = await loadPyodide();
    statusEl.textContent = "WASM Pyodide Environment Loaded!";
    pyodideLoading = false;
    return true;
  } catch (err) {
    console.error("Pyodide load fail:", err);
    statusEl.textContent = "Failed to load Python WASM sandbox.";
    pyodideLoading = false;
    return false;
  }
}

// Run Sandbox Benchmarks
async function runBenchmark() {
  const language = document.getElementById('language').value;
  const originalCode = codePhases[0];
  const refactoredCode = codePhases[3]; // Run Benchmark on full phase 3

  if (!originalCode || !refactoredCode) {
    showToast("Please run a code review analysis first!");
    return;
  }

  const runBtn = document.getElementById('run-sandbox-btn');
  runBtn.disabled = true;
  clearSandbox();

  if (language === 'Python') {
    await runPythonBenchmark(originalCode, refactoredCode);
  } else if (language === 'JavaScript' || language === 'TypeScript') {
    await runJSBenchmark(originalCode, refactoredCode);
  } else {
    showToast("Sandbox execution currently supported for Python and JS only.");
    runBtn.disabled = false;
  }
}

// Python execution inside WASM sandbox
async function runPythonBenchmark(origCode, refacCode) {
  const isLoaded = await initPyodide();
  const runBtn = document.getElementById('run-sandbox-btn');
  if (!isLoaded) {
    showToast("Could not load Python WebAssembly sandbox.");
    runBtn.disabled = false;
    return;
  }

  document.getElementById('sandbox-status-text').textContent = "Running Python Benchmarks...";

  // Capture outputs helper
  let origStdout = "";
  let refacStdout = "";

  // Set up redirect captures
  pyodideInstance.setStdout({ batched: (str) => { origStdout += str + "\n"; } });
  
  let origTime = 0;
  let refacTime = 0;
  let success = true;

  try {
    // Run Original code
    const t0 = performance.now();
    await pyodideInstance.runPythonAsync(origCode);
    const t1 = performance.now();
    origTime = t1 - t0;
    document.getElementById('console-original').textContent = origStdout || "[Execution finished with no console outputs]";
  } catch (err) {
    success = false;
    document.getElementById('console-original').textContent = "Error: " + err.message;
  }

  // Redirect stdout for refactored
  pyodideInstance.setStdout({ batched: (str) => { refacStdout += str + "\n"; } });

  try {
    // Run Refactored code
    const t2 = performance.now();
    await pyodideInstance.runPythonAsync(refacCode);
    const t3 = performance.now();
    refacTime = t3 - t2;
    document.getElementById('console-refactored').textContent = refacStdout || "[Execution finished with no console outputs]";
  } catch (err) {
    success = false;
    document.getElementById('console-refactored').textContent = "Error: " + err.message;
  }

  if (success) {
    displayBenchmarkResults(origTime, refacTime);
  } else {
    document.getElementById('sandbox-verdict').textContent = "Sandbox test finished with compilation or execution errors.";
    document.getElementById('sandbox-verdict').className = "sandbox-verdict";
    document.getElementById('sandbox-verdict').style.background = "rgba(255, 82, 82, 0.05)";
    document.getElementById('sandbox-verdict').style.borderColor = "var(--accent-error)";
    document.getElementById('sandbox-verdict').style.color = "var(--accent-error)";
  }

  document.getElementById('sandbox-status-text').textContent = "Benchmark complete!";
  runBtn.disabled = false;
}

// JS execution inside Web Workers
async function runJSBenchmark(origCode, refacCode) {
  document.getElementById('sandbox-status-text').textContent = "Running JavaScript Web Worker Benchmarks...";
  const runBtn = document.getElementById('run-sandbox-btn');

  // Web Worker script string
  const workerBlobCode = `
    self.onmessage = function(e) {
      const code = e.data.code;
      let logs = [];
      const customLog = (...args) => logs.push(args.join(' '));
      
      // Override console.log in worker context
      const originalConsoleLog = console.log;
      console.log = customLog;
      
      try {
        const start = performance.now();
        const fn = new Function(code);
        fn();
        const end = performance.now();
        self.postMessage({ success: true, logs: logs.join('\\n'), time: end - start });
      } catch(err) {
        self.postMessage({ success: false, error: err.message, logs: logs.join('\\n') });
      }
    };
  `;

  const blob = new Blob([workerBlobCode], { type: 'application/javascript' });
  const workerUrl = URL.createObjectURL(blob);

  // Helper promise runner for workers
  const runWorker = (code) => {
    return new Promise((resolve) => {
      const worker = new Worker(workerUrl);
      worker.onmessage = (e) => {
        worker.terminate();
        resolve(e.data);
      };
      worker.postMessage({ code });
      // Safety timeout
      setTimeout(() => {
        worker.terminate();
        resolve({ success: false, error: "Execution Timeout (possible infinite loop detected)" });
      }, 3500);
    });
  };

  const originalResult = await runWorker(origCode);
  const refactoredResult = await runWorker(refacCode);

  URL.revokeObjectURL(workerUrl);

  if (originalResult.success) {
    document.getElementById('console-original').textContent = originalResult.logs || "[Execution finished with no console outputs]";
  } else {
    document.getElementById('console-original').textContent = "Error: " + originalResult.error;
  }

  if (refactoredResult.success) {
    document.getElementById('console-refactored').textContent = refactoredResult.logs || "[Execution finished with no console outputs]";
  } else {
    document.getElementById('console-refactored').textContent = "Error: " + refactoredResult.error;
  }

  if (originalResult.success && refactoredResult.success) {
    displayBenchmarkResults(originalResult.time, refactoredResult.time);
  } else {
    document.getElementById('sandbox-verdict').textContent = "Sandbox test finished with execution errors.";
    document.getElementById('sandbox-verdict').className = "sandbox-verdict";
    document.getElementById('sandbox-verdict').style.background = "rgba(255, 82, 82, 0.05)";
    document.getElementById('sandbox-verdict').style.borderColor = "var(--accent-error)";
    document.getElementById('sandbox-verdict').style.color = "var(--accent-error)";
  }

  document.getElementById('sandbox-status-text').textContent = "Benchmark complete!";
  runBtn.disabled = false;
}

// Display visual runtime results, calculate speedups, and size progress bars
function displayBenchmarkResults(origT, refacT) {
  // Minimum duration normalization for UI
  const oTime = Math.max(origT, 0.001);
  const rTime = Math.max(refacT, 0.001);

  document.getElementById('time-original').textContent = oTime.toFixed(3) + " ms";
  document.getElementById('time-refactored').textContent = rTime.toFixed(3) + " ms";

  const maxTime = Math.max(oTime, rTime);
  const oPercent = (oTime / maxTime) * 100;
  const rPercent = (rTime / maxTime) * 100;

  document.getElementById('bar-original').style.width = oPercent + "%";
  document.getElementById('bar-refactored').style.width = rPercent + "%";

  const verdictEl = document.getElementById('sandbox-verdict');
  verdictEl.style.background = "";
  verdictEl.style.borderColor = "";
  verdictEl.style.color = "";

  if (rTime < oTime) {
    const speedup = oTime / rTime;
    verdictEl.textContent = `🚀 Refactored code runs ${speedup.toFixed(1)}x faster than the original version!`;
    verdictEl.className = "sandbox-verdict";
  } else if (rTime > oTime) {
    const slowDown = rTime / oTime;
    verdictEl.textContent = `⚠️ Refactored version is slightly slower (${slowDown.toFixed(1)}x runtime) due to safety or check overheads, but has better structure.`;
    verdictEl.className = "sandbox-verdict";
    verdictEl.style.borderColor = "var(--accent-purple)";
    verdictEl.style.color = "var(--accent-purple)";
    verdictEl.style.background = "rgba(157, 78, 221, 0.05)";
  } else {
    verdictEl.textContent = "⚖️ Both versions exhibit identical runtimes.";
    verdictEl.className = "sandbox-verdict";
  }
}