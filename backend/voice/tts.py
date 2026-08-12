from piper import PiperVoice
from pathlib import Path
import wave


class TextToSpeech:

    def __init__(self):

        model_path = (
            Path(__file__).parent.parent
            / "models"
            / "en_US-ryan-medium.onnx"
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

            self.voice.synthesize_wav(
                text,
                wav_file
            )