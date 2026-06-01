# 🔍 CodeLens — AI Code Reviewer

**AI-powered code review tool** built with **Flask + Claude (Anthropic)**.  
Paste your code and get professional, structured feedback instantly.

![Python](https://img.shields.io/badge/Python-3.11-blue)
![Flask](https://img.shields.io/badge/Flask-3.0-black)
![Claude](https://img.shields.io/badge/Claude-Sonnet-orange)

## ✨ Features

- **13+ languages** supported (Python, JavaScript, Java, C++, Rust, Go, etc.)
- **4 Review Modes**: General, Security, Performance, Style & Quality
- Beautiful modern dark UI with loading states and copy buttons
- Structured output with **Improved Code** section
- Token usage tracking
- Ready for Docker deployment

## 🚀 Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/Hazammm/ai-code-reviewer.git
cd ai-code-reviewer

# 2. Install dependencies
pip install -r requirements.txt

# 3. Setup API key
cp .env.example .env
Edit .env and add your Anthropic API key:
ANTHROPIC_API_KEY=sk-ant-...
Bash# 4. Run the app
python app.py
Open http://localhost:5000 in your browser.
🐳 Docker
Bashdocker build -t codelens .
docker run -p 5000:5000 --env-file .env codelens
📁 Project Structure
textai-code-reviewer/
├── app.py
├── requirements.txt
├── .env.example
├── Dockerfile
├── .gitignore
├── README.md
├── templates/
│   └── index.html
└── static/
    ├── css/
    │   └── style.css
    └── js/
        └── main.js
🛠️ Tech Stack

Backend: Flask + Anthropic SDK
Frontend: HTML, CSS, JavaScript (with Highlight.js)
AI Model: Claude Sonnet 4 (configurable)