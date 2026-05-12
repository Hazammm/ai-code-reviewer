from flask import Flask, render_template, request, jsonify
from anthropic import Anthropic
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

SYSTEM_PROMPT = """You are an expert code reviewer with deep knowledge across all programming languages.

Always structure your response using these EXACT headers:

## 🔍 Overview
Brief summary of what the code does and its overall quality (2-3 sentences).

## 🐛 Bugs & Issues
List any bugs, errors, or logic issues. If none, say "No critical bugs found."

## ⚡ Performance
Highlight performance concerns or optimizations. If none, say "No major performance issues."

## 🔒 Security
Flag any security vulnerabilities. If none, say "No security issues detected."

## 🧹 Code Quality
Comment on readability, naming conventions, structure, and best practices.

## ✅ Improved Code
Provide the refactored/improved version of the code with inline comments explaining changes.

## 📚 Summary
Rate the code 1-10 and give 2-3 clear actionable takeaways.

Be direct, specific, and educational."""

FOCUS_MAP = {
    "general":     "Give a comprehensive review covering all aspects.",
    "security":    "Focus especially on security vulnerabilities and unsafe practices.",
    "performance": "Focus especially on performance bottlenecks and optimizations.",
    "style":       "Focus especially on code style, readability, and best practices.",
}

LANGUAGES = [
    "Auto-detect", "Python", "JavaScript", "TypeScript",
    "C++", "C", "Java", "PHP", "Go", "Rust", "SQL", "Assembly", "Bash"
]

FOCUS_OPTIONS = [
    ("general",     "⚡ General Review"),
    ("security",    "🔒 Security Focus"),
    ("performance", "🚀 Performance Focus"),
    ("style",       "🧹 Style & Quality"),
]


@app.route("/")
def index():
    return render_template("index.html", languages=LANGUAGES, focus_options=FOCUS_OPTIONS)


@app.route("/review", methods=["POST"])
def review():
    data = request.get_json()
    code = data.get("code", "").strip()
    language = data.get("language", "Auto-detect")
    focus = data.get("focus", "general")

    if not code:
        return jsonify({"error": "Code cannot be empty"}), 400
    if len(code) > 10000:
        return jsonify({"error": "Code too long (max 10,000 characters)"}), 400

    focus_instruction = FOCUS_MAP.get(focus, FOCUS_MAP["general"])

    user_message = f"""Please review this {language} code:

```
{code}
```

Focus: {focus_instruction}"""

    try:
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )
        return jsonify({
            "review": message.content[0].text,
            "tokens_used": message.usage.input_tokens + message.usage.output_tokens
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
