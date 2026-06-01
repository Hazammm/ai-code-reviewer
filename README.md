# 🔍 CodeLens — AI Code Reviewer

**AI-powered code review tool** built with **Flask + Claude (Anthropic)**.  
Paste your code, choose a focus, and get structured, high-quality feedback instantly.

![Python](https://img.shields.io/badge/Python-3.10+-blue?style=flat-square)
![Flask](https://img.shields.io/badge/Flask-3.0-black?style=flat-square)
![Claude](https://img.shields.io/badge/Powered%20by-Claude%20Sonnet-orange?style=flat-square)

## ✨ Features

- **13+ languages** supported
- **4 Review Modes**: General, Security, Performance, Style & Quality
- **Structured Output** with bugs, security, performance, improved code & score
- Beautiful dark terminal-style UI
- Token usage tracking
- Fast and responsive

## 🚀 Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/Hazammm/ai-code-reviewer.git
cd ai-code-reviewer

# 2. Install dependencies
pip install -r requirements.txt

# 3. Add your Anthropic API key
cp .env.example .env
# Edit .env and put your key
# 4. Run the app
python app.py

Open http://localhost:5000

📁 Project Structure
textai-code-reviewer/
├── app.py
├── requirements.txt
├── .env.example
├── .gitignore
├── Dockerfile
├── templates/
│   └── index.html
└── static/
    ├── css/
    │   └── style.css
    └── js/
        └── main.js
