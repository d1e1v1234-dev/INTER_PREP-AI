from google import genai
from backend.config import GEMINI_API_KEY

class GeminiLLM:
    def __init__(self):
        self.client = genai.Client(api_key=GEMINI_API_KEY)
        self.model = "gemini-3.5-flash-lite"

    def generate(self,prompt:str) ->str:
        response = self.client.models.generate_content(
            model = self.model,
            contents=prompt
        )
        return response.text