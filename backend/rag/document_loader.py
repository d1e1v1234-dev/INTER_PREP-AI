from pypdf import PdfReader

class DocumentLoader:

    def load_pdf(self,pdf_path: str) -> str:
        reader = PdfReader(pdf_path)

        text =""

        for page in reader.pages:
            page_text = page.extract_text()

            if page_text:
                text +=page_text + "\n"

        return text