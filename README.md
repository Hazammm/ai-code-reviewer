# 🔍 CodeLens — AI Code Reviewer

AI-powered code review tool built with **Flask** + **Claude API**. Paste any code, get instant structured feedback on bugs, security, performance, and style.

![Python](https://img.shields.io/badge/Python-3.10+-blue?style=flat-square)
![Flask](https://img.shields.io/badge/Flask-3.0-black?style=flat-square)
![Claude](https://img.shields.io/badge/Powered%20by-Claude%20AI-orange?style=flat-square)

---

## ✨ Features

- **13 languages** — Python, JS, C++, PHP, SQL, Assembly, and more
- **4 review modes** — General, Security, Performance, Style
- **Structured output** — Bugs, Security, Performance, improved code + score
- **Dark terminal UI** — clean, dev-friendly interface
- **Token tracking** — see usage per review

---

## 🚀 Quick Start

```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/ai-code-reviewer.git
cd ai-code-reviewer

# 2. Install dependencies
pip install -r requirements.txt

# 3. Add API key
cp .env.example .env
# Edit .env → ANTHROPIC_API_KEY=your_key_here
# Get one free at: https://console.anthropic.com

# 4. Run
python app.py

# 5. Open → http://localhost:5000
```

---

## 📁 Project Structure

```
ai-code-reviewer/
├── app.py                  # Flask app + Claude integration
├── templates/
│   └── index.html          # Jinja2 template
├── static/
│   ├── css/style.css       # Styles
│   └── js/main.js          # Frontend logic
├── requirements.txt
├── .env.example
└── README.md
```

---

## 🔌 API

| Method | Route     | Description            |
|--------|-----------|------------------------|
| GET    | `/`       | Main UI                |
| POST   | `/review` | Submit code for review |
| GET    | `/health` | Health check           |

### POST `/review`
```json
{
  "code": "your code here",
  "language": "Python",
  "focus": "general"
}
```
`focus` options: `general` | `security` | `performance` | `style`

---

## 🛠 Stack

| Layer    | Tech               |
|----------|--------------------|
| Backend  | Flask, Python      |
| AI       | Anthropic Claude   |
| Frontend | Jinja2, CSS, JS    |
| Env      | python-dotenv      |

---

## 📄 License

MIT
