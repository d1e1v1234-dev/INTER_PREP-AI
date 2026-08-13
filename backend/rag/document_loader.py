from pypdf import PdfReader


class DocumentLoader:

    def load_pdf(self, pdf_path: str) -> str:
        reader = PdfReader(pdf_path)

        text = ""

        for page in reader.pages:
            page_text = page.extract_text()

            if page_text:
                text += page_text + "\n"

        if not text.strip():
            raise ValueError(
                "No selectable text could be found in this PDF. "
                "It looks like a scanned image or photo rather than "
                "a text document — try a PDF that has real, "
                "selectable text (e.g. exported from Word/Docs), "
                "or a PDF you've run OCR on."
            )

        return text