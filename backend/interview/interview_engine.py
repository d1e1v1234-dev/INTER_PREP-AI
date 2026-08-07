from backend.llm.gemini import GeminiLLM
from backend.llm.prompt_builder import load_prompt, build_prompt
from backend.memory.conversation_memory import ConversationMemory
from backend.interview.interview_config import InterviewConfig
from backend.llm.prompt_builder import build_report_prompt
from backend.rag.rag_pipeline import RAGPipeline

class InterviewEngine:

    def __init__(self):

        self.llm = GeminiLLM()
        self.memory = ConversationMemory()
        self.rag = RAGPipeline()

        self.config = None
        self.system_prompt = None

    def start_interview(self, interview_type: str, difficulty: str):

        self.memory = ConversationMemory()

        self.config = InterviewConfig(
            interview_type=interview_type,
            difficulty=difficulty
        )

        self.system_prompt = load_prompt("interview_prompt.txt")

        start_prompt = build_prompt(
            config=self.config,
            system_prompt=self.system_prompt,
            history=self.memory.get_history(),
            start_interview=True
        )

        response = self.llm.generate(start_prompt)

        self.memory.add_assistant_message(response)

        return response
    def chat(self, message: str):

        self.memory.add_user_message(message)

        rag_context = ""

        if self.config.interview_type == "PDF Based":
            rag_context = self.rag.retrieve(message)

        prompt = build_prompt(
            config=self.config,
            system_prompt=self.system_prompt,
            history=self.memory.get_history(),
            rag_context=rag_context,
            start_interview=False
        )

        response = self.llm.generate(prompt)

        self.memory.add_assistant_message(response)

        return response
    
    def upload_pdf(self, pdf_path: str):

        self.rag.load_document(pdf_path)

        return "PDF Uploaded Successfully"
    

    def end_interview(self):

        report_system_prompt = load_prompt("report_prompt.txt")

        report_prompt = build_report_prompt(
            report_system_prompt,
            self.memory.get_history()
        )

        report = self.llm.generate(report_prompt)

        return report
