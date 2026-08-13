from piper import PiperVoice
from pathlib import Path
import wave


class TextToSpeech:

    def __init__(self):

        model_path = (
            Path(__file__).parent.parent
            / "models"
            / "en_US-ryan-low.onnx"
        )

        self.voice = PiperVoice.load(
            str(model_path)
        )

    def synthesize(
        self,
        text: str,
        output_path: str
    ):

        with wave.open(
            output_path,
            "wb"
        ) as wav_file:

            self.voice.synthesize(
                text,
                wav_file
            )

    def synthesize_stream(self, text: str):
        """
        Splits text into sentences and yields a separate WAV file
        (as bytes) per sentence, as soon as each one is ready —
        instead of waiting for the entire text to be synthesized.
        """
        import re
        import io

        # Basic sentence split; keeps punctuation attached
        sentences = re.split(r'(?<=[.!?])\s+', text.strip())
        sentences = [s for s in sentences if s.strip()]

        for sentence in sentences:
            buffer = io.BytesIO()
            with wave.open(buffer, "wb") as wav_file:
                self.voice.synthesize(sentence, wav_file)
            yield buffer.getvalue()