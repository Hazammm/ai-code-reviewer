from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from anthropic import Anthropic
import os

app = FastAPI(title="AI Code Reviewer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

SYSTEM_PROMPT = """You are an expert code reviewer with deep knowledge across all programming languages and paradigms.

When reviewing code, always structure your response in this EXACT format using these section headers:

## 🔍 Overview
Brief summary of what the code does and its overall quality (2-3 sentences).

## 🐛 Bugs & Issues
List any bugs, errors, or logic issues. If none, say "No critical bugs found."

## ⚡ Performance
Highlight performance concerns or optimizations. If none, say "No major performance issues."

## 🔒 Security
Flag any security vulnerabilities. If none, say "No security issues detected."

## 🧹 Code Quality
Comment on readability, naming, structure, and best practices.

## ✅ Improved Code
Provide the refactored/improved version of the code with comments explaining changes.

## 📚 Summary
Rate the code 1-10 and give 2-3 actionable takeaways.

Be direct, specific, and educational. Mention the language/framework when relevant."""


class ReviewRequest(BaseModel):
    code: str
    language: str = "auto-detect"
    focus: str = "general"  # general | security | performance | style


@app.post("/review")
async def review_code(request: ReviewRequest):
    if not request.code.strip():
        raise HTTPException(status_code=400, detail="Code cannot be empty")

    if len(request.code) > 10000:
        raise HTTPException(status_code=400, detail="Code too long (max 10,000 characters)")

    focus_instructions = {
        "general": "Give a comprehensive review covering all aspects.",
        "security": "Focus especially on security vulnerabilities and unsafe practices.",
        "performance": "Focus especially on performance bottlenecks and optimizations.",
        "style": "Focus especially on code style, readability, and best practices.",
    }

    user_message = f"""Please review this {request.language} code:

```
{request.code}
```

Focus: {focus_instructions.get(request.focus, focus_instructions['general'])}"""

    try:
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )
        return {"review": message.content[0].text, "tokens_used": message.usage.input_tokens + message.usage.output_tokens}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {"status": "ok"}


# Serve frontend
app.mount("/static", StaticFiles(directory="../frontend/static"), name="static")

@app.get("/")
async def serve_frontend():
    return FileResponse("../frontend/index.html")
