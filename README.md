# INTER_PREP AI

**Practice like it's the real room. Get graded like it matters.**

INTER_PREP AI is a full-stack AI interview coach. It runs realistic, one-question-at-a-time mock interviews over text or voice, adapts difficulty as you go, and generates a graded report at the end. It supports curated tracks (Machine Learning, DSA, HR), a custom topic you type yourself, and PDF-based interviews where the AI questions you on a document you upload.

---

## Features

- **Text or Voice interviews** — type your answers, or have a real back-and-forth: the AI asks the question out loud (Piper TTS) and you answer by speaking (faster-whisper STT).
- **Interview types** — Machine Learning, DSA, HR, PDF Based (RAG over your uploaded document), or a free-text Custom Topic.
- **Adaptive difficulty** — Easy / Medium / Hard, with the interviewer escalating difficulty as you perform well.
- **Realistic questioning** — the interviewer stays on a question with hints and follow-ups when you're stuck or when there's more to probe, instead of moving on after every single reply.
- **Continue later** — resume any past interview (finished or abandoned) from exactly where you left off; the AI keeps the full prior context.
- **Graded reports** — a structured report is generated on request once an interview ends.
- **Auth** — JWT-based register/login, per-user interview history.

---

## Architecture

```
frontend/            Static HTML/CSS/JS client (no build step)
backend/
  api/                FastAPI routes (interviews, chat, PDF upload, resume) + auth routes
  auth/                JWT auth, password hashing
  interview/           InterviewEngine — orchestrates a single interview session
  llm/                 Gemini chat model wrapper + prompt loading
  memory/              Conversation history (in-memory per active session)
  rag/                 PDF loading, chunking, Gemini embeddings, FAISS vector store
  voice/               TTS (Piper) and STT (faster-whisper) routes
  database/            SQLAlchemy models (MySQL) + session handling
  prompts/             System prompt templates (interview + report generation)
  models/              Piper voice model files (.onnx)
Dockerfile            Backend container image
docker-compose.yml    Backend + MySQL for local/VM deployment
requirements.txt      Python dependencies
```

**Backend:** FastAPI + SQLAlchemy (MySQL) + LangChain (Gemini) + FAISS for PDF RAG + faster-whisper (STT) + Piper (TTS).

**Frontend:** Plain HTML/CSS/JS — no framework, no build step. Talks to the backend over a REST API defined by `API_BASE` in `script.js`.

**Note on state:** while an interview is in progress, its live conversation state lives in memory in the backend process (keyed per user). The full conversation is also persisted to the database on `/chat` and `/end-interview`, which is what makes `/interviews/{id}/resume` possible even after a server restart.

---

## Setup

### Prerequisites

- Python 3.11
- MySQL (local install, or use the provided `docker-compose.yml`)
- A [Gemini API key](https://ai.google.dev/)

### 1. Clone and install

```bash
git clone <your-repo-url>
cd <project-root>
python3 -m venv INTER.env
source INTER.env/bin/activate      # Windows: INTER.env\Scripts\activate
pip install -r requirements.txt --break-system-packages
```

### 2. Configure environment variables

Copy `.env.example` to `.env` in the project root and fill in:

```env
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL=mysql+pymysql://root:@localhost:3306/inter_prep
JWT_SECRET_KEY=change-this-to-a-long-random-string
ALLOWED_ORIGINS=*
```

Generate a strong `JWT_SECRET_KEY` with:
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### 3. Run the backend

```bash
uvicorn backend.main:app --reload --port 8000
```

Visit `http://127.0.0.1:8000/docs` for interactive API docs (Swagger UI).

### 4. Run the frontend

In a separate terminal:

```bash
cd frontend
python3 -m http.server 5500
```

Visit `http://127.0.0.1:5500/index.html`.

> Use a plain static server (not a live-reload dev server like VS Code Live Server). Live-reload tools force a full page refresh whenever any file changes, which will reset an in-progress interview session.

Update `API_BASE` at the top of `frontend/script.js` to point at your backend if it's not running on `http://127.0.0.1:8000`.

---

## Running with Docker

```bash
cp .env.example .env   # fill in GEMINI_API_KEY and JWT_SECRET_KEY
docker compose up -d --build
```

This starts the backend (port 8000) and a MySQL instance together, with persistent volumes for the database, uploaded PDFs, and generated TTS audio.

---

## API overview

All routes are prefixed as shown. Full interactive docs at `/docs`.

**Auth** (`/auth`)
| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Create an account |
| POST | `/auth/login` | Log in, get a JWT access token |

**Interviews**
| Method | Path | Description |
|---|---|---|
| POST | `/start-interview` | Start a new interview (type, difficulty) |
| POST | `/chat` | Send an answer, get the interviewer's next message |
| POST | `/upload-pdf` | Upload a PDF for a PDF-based interview |
| POST | `/end-interview` | End the current interview and generate a report |
| GET | `/interviews` | List the current user's past interviews |
| GET | `/interviews/{id}` | Get one interview's full conversation + report |
| POST | `/interviews/{id}/resume` | Resume a past interview from where it left off |

**Voice** (`/voice`)
| Method | Path | Description |
|---|---|---|
| POST | `/voice/synthesize` | Text → speech (Piper), returns audio |
| POST | `/voice/transcribe` | Speech → text (faster-whisper) |

All routes except `/auth/*` and `/voice/transcribe` require a `Authorization: Bearer <token>` header.

---

## Deployment

The backend is deployable via the included `Dockerfile` to any container platform (Railway, Render, Google Cloud Run, a plain VM with `docker-compose`, etc.). Key things to configure on your platform:

- Env vars: `GEMINI_API_KEY`, `DATABASE_URL`, `JWT_SECRET_KEY`, `ALLOWED_ORIGINS` (comma-separated list of your frontend origin(s) — don't leave this as `*` in production)
- Expose port `8000`
- Persistent storage/volumes for `backend/uploads` and `backend/tts_outputs` if your platform's filesystem is ephemeral

The frontend is static and can be deployed anywhere that serves static files (Netlify, Vercel, GitHub Pages, S3, etc.) — just point `API_BASE` in `script.js` at your deployed backend URL first.

**Resource note:** faster-whisper + Piper + FAISS + LangChain running together need more RAM than a typical "free tier" web service allocates. If you see 500/502 errors specifically on `/voice/synthesize` or `/voice/transcribe`, or unexplained container restarts, it's most likely memory pressure — either use a smaller Whisper model (`base` instead of `small`) or move to a plan/host with more RAM.

---

## Known limitations

- Resuming a past interview always reopens it in **Text mode** — the mode (voice/text) isn't currently persisted per interview.
- PDF-based interviews need a PDF with actual selectable text (not a scanned image/photo) — image-only PDFs will fail with a clear error rather than silently producing bad questions.
- The live "in-progress" engine state is per-process; if the backend restarts mid-interview without the person using resume, that specific in-memory session is gone (though everything sent via `/chat` up to that point is already saved to the database).
