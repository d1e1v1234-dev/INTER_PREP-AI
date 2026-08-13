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

    def synthesize_stream(self, text: str, max_words_per_chunk: int = 10):
        """
        Splits text into small chunks (~max_words_per_chunk words each)
        and yields a separate WAV file (as bytes) per chunk, as soon as
        it's ready — instead of waiting for the entire text to be
        synthesized. This keeps the first audio arriving fast even when
        a single sentence is long.

        Chunk boundaries prefer sentence-end punctuation (. ! ?) so we
        don't cut mid-clause when a sentence happens to end right around
        the word limit; otherwise we just cut at the word limit.
        """
        import re
        import io

        # Tokenize into words, keeping track of sentence-ending punctuation
        words = text.strip().split()

        chunks = []
        current_chunk = []

        for word in words:
            current_chunk.append(word)

            ends_sentence = bool(re.search(r'[.!?]["\')]*$', word))
            hit_word_limit = len(current_chunk) >= max_words_per_chunk

            if hit_word_limit or (ends_sentence and len(current_chunk) >= max(5, max_words_per_chunk // 2)):
                chunks.append(" ".join(current_chunk))
                current_chunk = []

        if current_chunk:
            chunks.append(" ".join(current_chunk))

        for chunk_text in chunks:
            if not chunk_text.strip():
                continue
            buffer = io.BytesIO()
            with wave.open(buffer, "wb") as wav_file:
                self.voice.synthesize(chunk_text, wav_file)
            yield buffer.getvalue()