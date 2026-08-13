from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
from pathlib import Path
import uuid
import os
import struct

from .tts import TextToSpeech


router = APIRouter(
    prefix="/voice",
    tags=["Voice"]
)


# Load Piper only once
tts_model = TextToSpeech()


class TTSRequest(BaseModel):

    text: str


@router.post("/synthesize")
async def synthesize_voice(
    request: TTSRequest
):

    text = request.text.strip()


    if not text:

        raise HTTPException(
            status_code=400,
            detail="Text cannot be empty."
        )


    # Create temporary output directory
    output_dir = (
        Path(__file__).parent.parent
        / "tts_outputs"
    )

    output_dir.mkdir(
        exist_ok=True
    )


    filename = (
        f"{uuid.uuid4().hex}.wav"
    )

    output_path = (
        output_dir / filename
    )


    try:

        # Generate speech using Piper DL model
        tts_model.synthesize(
            text,
            str(output_path)
        )


        if not output_path.exists():

            raise Exception(
                "Audio file was not generated."
            )


        if output_path.stat().st_size == 0:

            raise Exception(
                "Generated audio file is empty."
            )


        return FileResponse(
            path=str(output_path),
            media_type="audio/wav",
            filename="ai_response.wav"
        )


    except Exception as e:

        if output_path.exists():
            os.remove(output_path)


        raise HTTPException(
            status_code=500,
            detail=f"TTS failed: {str(e)}"
        )


@router.post("/synthesize-stream")
async def synthesize_voice_stream(
    request: TTSRequest
):
    """
    Streams audio back sentence-by-sentence instead of waiting for
    the full text to synthesize. Each chunk is sent as:
    [4 bytes: chunk length (uint32, big-endian)] + [chunk WAV bytes]
    so the frontend can split the stream back into playable clips.
    """

    text = request.text.strip()

    if not text:
        raise HTTPException(
            status_code=400,
            detail="Text cannot be empty."
        )

    def audio_generator():
        try:
            for wav_bytes in tts_model.synthesize_stream(text):
                length_prefix = struct.pack(">I", len(wav_bytes))
                yield length_prefix + wav_bytes
        except Exception as e:
            # Can't raise HTTPException mid-stream; just stop the stream.
            # Client should handle an incomplete/short stream gracefully.
            print(f"TTS streaming failed: {e}")
            return

    return StreamingResponse(
        audio_generator(),
        media_type="application/octet-stream"
    )