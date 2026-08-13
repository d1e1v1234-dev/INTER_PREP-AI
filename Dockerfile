FROM python:3.11-slim

# System deps:
# - espeak-ng: required by piper-tts for phonemization
# - ffmpeg: audio decoding for uploaded voice answers (webm/mp4 -> wav)
# - build-essential/gcc: fallback in case any pip package needs to compile
# - default-libmysqlclient-dev + pkg-config: not strictly needed for pymysql
#   (pure python driver), kept out to keep the image lean
RUN apt-get update && apt-get install -y --no-install-recommends \
    espeak-ng \
    ffmpeg \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps first for better layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Pre-download the faster-whisper "base" model into the image so the
# container never has to hit the internet for it at runtime (avoids a
# slow/unreliable first request and works even if the host blocks
# outbound downloads after deploy). "base" is used instead of "small"
# to keep memory usage low on constrained hosting plans.
RUN python3 -c "from faster_whisper import WhisperModel; WhisperModel('base', device='cpu', compute_type='int8')"

# App code
COPY backend ./backend

# Runtime folders the app writes to (uploads, generated TTS audio)
RUN mkdir -p backend/uploads backend/tts_outputs

EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]