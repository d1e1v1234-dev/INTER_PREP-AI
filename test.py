from langchain_google_genai import ChatGoogleGenerativeAI
from backend.config import GEMINI_API_KEY

llm = ChatGoogleGenerativeAI(
    model="gemini-3.5-flash-lite",
    google_api_key=GEMINI_API_KEY,
)

response = llm.invoke("Say Hello")

print(response.content)