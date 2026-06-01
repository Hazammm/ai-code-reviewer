from flask import Flask, render_template, request, jsonify
from anthropic import Anthropic
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

SYSTEM_PROMPT = """You are an expert senior software engineer and code reviewer.
Always respond using these exact markdown headers:

## 🔍 Overview
## 🐛 Bugs & Issues
## ⚡ Performance
## 🔒 Security
## 🧹 Code Quality
## ✅ Improved Code
## 📊 Summary

Be concise, direct, and educational."""

FOCUS_MAP = {
    "general": "Give a comprehensive review covering all aspects.",
    "security": "Focus heavily on security vulnerabilities and unsafe practices.",
    "performance": "Focus heavily on performance, efficiency, and scalability.",
    "style": "Focus on code style, readability, best practices, and maintainability.",
}

LANGUAGES = ["Auto-detect", "Python", "JavaScript", "TypeScript", "Java", "C++", "C", "Go", "Rust", "PHP", "SQL", "Bash", "Assembly"]

FOCUS_OPTIONS = [
    ("general", "⚡ General Review"),
    ("security", "🔒 Security Focus"),
    ("performance", "🚀 Performance Focus"),
    ("style", "🧹 Style & Quality"),
]


@app.route("/")
def index():
    return render_template("index.html", 
                         languages=LANGUAGES, 
                         focus_options=FOCUS_OPTIONS)


@app.route("/review", methods=["POST"])
def review():
    try:
        data = request.get_json()
        code = data.get("code")
        language = data.get("language")
        focus = data.get("focus")

        if not code or len(code.strip()) < 10:
            return jsonify({"error": "Please provide valid code"}), 400

        focus_instruction = FOCUS_MAP.get(focus, FOCUS_MAP["general"])

        user_message = f"""Language: {language}
Review Focus: {focus_instruction}

Code to review:
```{language.lower() if language != "Auto-detect" else ""}
{code}
```"""

        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4000,
            temperature=0.3,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}]
        )

        return jsonify({
            "review": response.content[0].text,
            "model": "claude-sonnet-4",
            "tokens": response.usage.input_tokens + response.usage.output_tokens
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)