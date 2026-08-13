from faster_whisper import WhisperModel


class SpeechToText:

    def __init__(self):

        self.model = WhisperModel(
            "base",
            device="cpu",
            compute_type="int8"
        )


    def transcribe(self, audio_path):

        segments, info = self.model.transcribe(
            audio_path,
            beam_size=1
        )

        text = " ".join(
            segment.text
            for segment in segments
        )

        return text.strip()