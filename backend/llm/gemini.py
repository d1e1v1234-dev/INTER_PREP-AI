from langchain_google_genai import ChatGoogleGenerativeAI
from backend.config import GEMINI_API_KEY


class GeminiLLM:

    def __init__(self):
        self.model = ChatGoogleGenerativeAI(
            model="gemini-3.5-flash-lite",
            google_api_key=GEMINI_API_KEY,
            thinking_level="low",
            max_output_tokens=4096,
            
        )
    # def __init__(self):
    #     self.llm = HuggingFaceEndpoint(
    #     repo_id="meta-llama/Llama-3.1-8B-Instruct",
    #     task = "text-generation",
    #     huggingfacehub_api_token=HUGGINGFACE_API_KEY
    # )
    #     self.model = ChatHuggingFace(llm = self.llm)

    def generate(self, prompt: str) -> str:

        response = self.model.invoke(prompt)

        if isinstance(response.content, list):
            return response.content[0]["text"]

        return response.content