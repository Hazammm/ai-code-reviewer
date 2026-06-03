from flask import Flask, render_template, request, Response, jsonify, stream_with_context
from anthropic import Anthropic
from dotenv import load_dotenv
import os
import json

load_dotenv()

app = Flask(__name__)
def get_anthropic_client():
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key or api_key.startswith("sk-ant-your-key"):
        raise ValueError("Anthropic API key is missing. Please configure ANTHROPIC_API_KEY in your .env file.")
    return Anthropic(api_key=api_key)

SYSTEM_PROMPT = """You are an expert senior software engineer and code reviewer.
Always respond using these exact markdown headers:

## 🔍 Overview
## 🐛 Bugs & Issues
## ⚡ Performance
## 🔒 Security
## 🧹 Code Quality
## 📊 Summary

Be concise, direct, and educational.

In addition to the markdown review, you must output the improved/refactored code in three progressive phases inside these exact XML blocks at the very end of your response:

<refactor_phase_1 description="Security patches">
[Insert complete code with security patches only]
</refactor_phase_1>

<refactor_phase_2 description="Performance improvements">
[Insert complete code with security AND performance improvements]
</refactor_phase_2>

<refactor_phase_3 description="Readability & structure">
[Insert complete code with security, performance, AND readability/structure/docs improvements]
</refactor_phase_3>

Ensure the code inside the tags is the complete code, not snippets. Do not wrap the code inside the XML blocks in markdown code fences (like ```), just write the raw code directly. The tags must contain the full refactored code at each stage so the editor can load them."""

FOCUS_MAP = {
    "general": "Give a comprehensive review covering all aspects.",
    "security": "Focus heavily on security vulnerabilities, safe input handling, encryption, and prevention of common exploits (SQLi, XSS, CSRF, etc.).",
    "performance": "Focus heavily on time and space complexity, memory management, concurrency, database query optimization, and latency reduction.",
    "style": "Focus heavily on clean code principles, naming conventions, design patterns, documentation, testability, and standard formatting style guides.",
}

LANGUAGES = ["Auto-detect", "Python", "JavaScript", "TypeScript", "Java", "C++", "C", "Go", "Rust", "PHP", "SQL", "HTML", "CSS"]

FOCUS_OPTIONS = [
    ("general", "⚡ General Review"),
    ("security", "🔒 Security Focus"),
    ("performance", "🚀 Performance Focus"),
    ("style", "🧹 Style & Quality"),
]


def calculate_metrics(code):
    metrics = {
        "loc": 0,
        "lloc": 0,
        "complexity": 0,
        "complexity_rank": "A",
        "mi": 100.0,
        "mi_rank": "A"
    }
    if not code:
        return metrics

    try:
        # Try importing radon for raw metrics
        from radon.raw import analyze
        raw = analyze(code)
        metrics["loc"] = raw.loc
        metrics["lloc"] = raw.lloc

        # Try radon for cyclomatic complexity
        from radon.visitors import ComplexityVisitor
        v = ComplexityVisitor.from_code(code)
        if v.blocks:
            complexities = [block.complexity for block in v.blocks]
            metrics["complexity"] = sum(complexities)
            avg_comp = sum(complexities) / len(complexities)
            if avg_comp <= 5: metrics["complexity_rank"] = "A"
            elif avg_comp <= 10: metrics["complexity_rank"] = "B"
            elif avg_comp <= 20: metrics["complexity_rank"] = "C"
            else: metrics["complexity_rank"] = "D"
        else:
            metrics["complexity"] = 1
            metrics["complexity_rank"] = "A"

        # Try radon for maintainability index
        from radon.metrics import mi_visit
        mi = mi_visit(code, multi=True)
        if mi is not None:
            metrics["mi"] = round(mi, 1)
            if mi >= 50: metrics["mi_rank"] = "A"
            elif mi >= 20: metrics["mi_rank"] = "B"
            else: metrics["mi_rank"] = "C"

    except Exception:
        # Robust fallback parser for non-Python or if radon fails
        lines = code.splitlines()
        metrics["loc"] = len(lines)
        metrics["lloc"] = len([l for l in lines if l.strip()])
        
        # Approximate Cyclomatic Complexity based on branch keywords
        branch_keywords = ["if ", "if(", "for ", "for(", "while ", "while(", "catch", "case ", "&&", "||", "?", "elif "]
        complexity_estimate = 1
        for line in lines:
            for kw in branch_keywords:
                complexity_estimate += line.count(kw)
        
        metrics["complexity"] = complexity_estimate
        if complexity_estimate <= 5: metrics["complexity_rank"] = "A"
        elif complexity_estimate <= 10: metrics["complexity_rank"] = "B"
        elif complexity_estimate <= 20: metrics["complexity_rank"] = "C"
        else: metrics["complexity_rank"] = "D"

        # Approximate Maintainability Index based on lines of code and complexity estimation
        approx_mi = max(0, min(100, 100 - (len(lines) * 0.15) - (complexity_estimate * 1.5)))
        metrics["mi"] = round(approx_mi, 1)
        if approx_mi >= 50: metrics["mi_rank"] = "A"
        elif approx_mi >= 20: metrics["mi_rank"] = "B"
        else: metrics["mi_rank"] = "C"

    return metrics


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
            return jsonify({"error": "Please provide valid code (at least 10 characters)"}), 400

        # Compute metrics locally
        metrics = calculate_metrics(code)

        focus_instruction = FOCUS_MAP.get(focus, FOCUS_MAP["general"])
        user_message = f"""Language: {language}
Review Focus: {focus_instruction}

Code to review:
```{language.lower() if language != "Auto-detect" else ""}
{code}
```"""

        def generate():
            # First send metrics
            yield f"data: {json.dumps({'type': 'metrics', 'metrics': metrics})}\n\n"

            # Call Anthropic API with streaming
            try:
                client = get_anthropic_client()
                response = client.messages.create(
                    model="claude-3-5-sonnet-latest",
                    max_tokens=4000,
                    temperature=0.3,
                    system=SYSTEM_PROMPT,
                    messages=[{"role": "user", "content": user_message}],
                    stream=True
                )
                
                input_tokens = 0
                output_tokens = 0

                for chunk in response:
                    if chunk.type == "message_start":
                        input_tokens = chunk.message.usage.input_tokens
                    elif chunk.type == "content_block_delta" and chunk.delta.type == "text_delta":
                        yield f"data: {json.dumps({'type': 'content', 'delta': chunk.delta.text})}\n\n"
                    elif chunk.type == "message_delta":
                        output_tokens = chunk.usage.output_tokens
                
                # Send total tokens at the end
                yield f"data: {json.dumps({'type': 'tokens', 'input_tokens': input_tokens, 'output_tokens': output_tokens})}\n\n"

            except Exception as api_err:
                yield f"data: {json.dumps({'type': 'error', 'error': str(api_err)})}\n\n"

        return Response(stream_with_context(generate()), mimetype="text/event-stream")

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)