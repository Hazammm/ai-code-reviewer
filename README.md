# 🔍 CodeLens — AI Code Reviewer

An AI-powered code review tool built with **FastAPI** + **Claude API**. Paste any code, get instant feedback on bugs, security, performance, and style.

![Python](https://img.shields.io/badge/Python-3.10+-blue?style=flat-square)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green?style=flat-square)
![Claude](https://img.shields.io/badge/Powered%20by-Claude%20AI-orange?style=flat-square)

---

## ✨ Features

- **Multi-language support** — Python, JS, C++, PHP, SQL, Assembly, and more
- **4 review modes** — General, Security, Performance, Style & Quality
- **Structured reviews** — Bugs, Security, Performance, improved code, and a score
- **Clean dark UI** — terminal-aesthetic frontend, no frameworks needed
- **Token usage tracking** — see how much each review costs

---

##  Quick Start

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/ai-code-reviewer.git
cd ai-code-reviewer
```

### 2. Set up the backend
```bash
cd backend
pip install -r requirements.txt
```

### 3. Add your API key
```bash
cp .env.example .env
# Edit .env and add your Anthropic API key
# Get one free at: https://console.anthropic.com
```

### 4. Run the server
```bash
cd backend
uvicorn main:app --reload --port 8000
```

### 5. Open the app
Visit localhost in your browser.

---

## 📁 Project Structure

```
ai-code-reviewer/
├── backend/
│   ├── main.py           # FastAPI app + Claude integration
│   └── requirements.txt  # Python dependencies
├── frontend/
│   └── index.html        # Single-file UI (HTML + CSS + JS)
├── .env.example          # Environment variable template
├── .gitignore
└── README.md
```

---

## 🔌 API Endpoints

| Method | Endpoint  | Description              |
|--------|-----------|--------------------------|
| POST   | `/review` | Submit code for review   |
| GET    | `/health` | Health check             |
| GET    | `/`       | Serve frontend UI        |

### POST `/review` — Request Body
```json
{
  "code": "def add(a, b):\n    return a + b",
  "language": "Python",
  "focus": "general"
}
```

`focus` options: `general` | `security` | `performance` | `style`

---

## 🛠 Tech Stack

| Layer    | Tech                    |
|----------|-------------------------|
| Backend  | FastAPI, Uvicorn        |
| AI       | Anthropic Claude API    |
| Frontend | Vanilla HTML/CSS/JS     |
| Fonts    | JetBrains Mono, Syne    |

---

## Example Review Output

```
##  Overview
The function implements a basic bubble sort with O(n²) complexity...

## Bugs & Issues
- Off-by-one error on line 7: range should be range(n-1)

## Performance
- Consider using Python's built-in sorted() for production use

##  Security
No security issues detected.

##  Improved Code
...

## Summary
Score: 6/10 — Good structure but has a critical bug and can be optimized.
```

---

##  License

MIT — free to use, modify, and distribute.
