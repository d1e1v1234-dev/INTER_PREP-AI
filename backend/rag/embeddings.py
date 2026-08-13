from langchain_google_genai import GoogleGenerativeAIEmbeddings
from backend.config import GEMINI_API_KEY


class EmbeddingModel:

    def __init__(self):
        self.embedding = GoogleGenerativeAIEmbeddings(
            model="models/gemini-embedding-001",
            google_api_key=GEMINI_API_KEY
        )

    def get_embedding(self):
        return self.embedding