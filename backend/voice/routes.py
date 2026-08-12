from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from pathlib import Path
import uuid
import os

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