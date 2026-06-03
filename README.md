# 🔍 CodeLens Pro — State-of-the-Art AI Code Reviewer

**CodeLens Pro** is a premium, developer-centric code review and benchmarking platform. Built on **Flask + Claude 3.5 Sonnet (Anthropic)**, it elevates static code analysis into an interactive visual environment featuring split diff views, static complexity indexes, and client-side sandboxed benchmarking.

![Python](https://img.shields.io/badge/Python-3.11-blue)
![Flask](https://img.shields.io/badge/Flask-3.0-black)
![Claude](https://img.shields.io/badge/Claude--3.5--Sonnet-orange)
![Monaco](https://img.shields.io/badge/Monaco--Editor-red)
![Pyodide](https://img.shields.io/badge/WebAssembly-Pyodide-brightgreen)

---

## ✨ Features

### 1. Monaco Editor & Split Diff Visualizer
- Replaced standard textareas with **Monaco Editor** (the code editor powering VS Code), bringing syntax highlighting, line numbers, and indentation mapping.
- Toggle into **Monaco Diff Editor** to visualize insertions, deletions, and refactoring modifications side-by-side in real-time.

### 2. "Time-Travel" Refactoring Timeline Slider
- Instead of a single massive file block, CodeLens Pro prompts Claude to generate refactorings in modular, progressive phases:
  - **Original**
  - **Phase 1: Security patches** (protecting inputs, fixing memory bugs)
  - **Phase 2: Performance improvements** (optimizing concurrency, memory, loops)
  - **Phase 3: Readability & Styling** (adding docstrings, cleaning conventions)
- Use the **interactive timeline slider** to morph the split diff view between each phase, then click to apply your preferred level of refactoring back into your editor workspace.

### 3. Local Static Code Metrics Dashboard
- Before running the LLM, the python backend runs local abstract syntax tree (AST) static analysis using `radon` to calculate **Lines of Code**, **Logical LOC**, **Complexity Rank**, and **Maintainability Index**.
- Displays an instant grade card dashboard (Ranks A–D) to guide developers immediately.

### 4. Client-Side WASM Performance Benchmarker
- Execute code snippets inside a client-side execution sandbox:
  - **Python:** Runs inside a browser WebAssembly runtime (**Pyodide**).
  - **JavaScript/TypeScript:** Runs inside isolated browser **Web Workers** (preventing main-thread page freezes).
- Automatically benchmarks the original code against the Phase 3 refactored code and plots proportional glowing run-time bars showing speedup factors (e.g. `2.4x faster`).

### 5. SSE streaming and Markdown sanitization
- Streams responses word-by-word via **Server-Sent Events (SSE)**.
- Renders Markdown syntax incrementally on the fly with safe HTML sanitization (`DOMPurify`) to prevent XSS.

---

## 🚀 Quick Start

### 1. Clone & Set Up
```bash
# Clone the repository
git clone https://github.com/Hazammm/ai-code-reviewer.git
cd ai-code-reviewer

# Install dependencies (including radon for static metrics)
pip install -r requirements.txt
```

### 2. Configure Environment Keys
Create a `.env` file in the root directory (based on `.env.example`):
```bash
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### 3. Run Development Server
```bash
python app.py
```
Open `http://localhost:5000` in your browser.

---

## 🐳 Docker Deployment

To build and run CodeLens Pro in a container:
```bash
# Build the container
docker build -t codelens-pro .

# Start the container linking environment variables
docker run -p 5000:5000 --env-file .env codelens-pro
```

---

## 📁 Project Structure

```text
ai-code-reviewer/
├── app.py                  # Stream generator, API configurations & Radon metrics parser
├── requirements.txt        # Backend dependencies
├── .env.example            # Environment template
├── Dockerfile              # Docker deployment setup
├── README.md               # Project documentation
├── templates/
│   └── index.html          # Dashboard markup, Monaco loaders, and CDN integrations
└── static/
    ├── css/
    │   └── style.css       # Glassmorphism tokens, neon borders, and animations
    └── js/
        └── main.js         # Monaco initialization, SSE reader, and sandbox benchmarking engine
```