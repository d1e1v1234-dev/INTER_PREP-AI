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

        self.INTERVIEW_MAP = {
            "1": "HR",
            "2": "DSA",
            "3": "Machine Learning",
            "4": "PDF Based"
        }

        self.DIFFICULTY_MAP = {
            "1": "Easy",
            "2": "Medium",
            "3": "Hard"
        }

    def start(self):

        print("=" * 60)
        print("Welcome to INTER_PREP AI")
        print("=" * 60)

        # -------------------------
        # Select Interview Type
        # -------------------------

        print("\nChoose Interview Type")
        print("1. HR")
        print("2. DSA")
        print("3. Machine Learning")
        print("4. PDF Based")

        choice = input("> ")

        interview_type = self.INTERVIEW_MAP.get(choice)

        if interview_type is None:
            print("Invalid Interview Type")
            return

        # -------------------------
        # Select Difficulty
        # -------------------------

        print("\nChoose Difficulty")
        print("1. Easy")
        print("2. Medium")
        print("3. Hard")

        difficulty_choice = input("> ")

        difficulty = self.DIFFICULTY_MAP.get(difficulty_choice)

        if difficulty is None:
            print("Invalid Difficulty")
            return

        # -------------------------
        # Create Interview Config
        # -------------------------

        self.config = InterviewConfig(
            interview_type=interview_type,
            difficulty=difficulty
        )
        if self.config.interview_type == "PDF Based":

            pdf_path = input("\nEnter PDF Path: ").strip()

            self.rag.load_document(pdf_path)

            print("✅ PDF Loaded Successfully!")
        # -------------------------
        # Load Prompt
        # -------------------------

        self.system_prompt = load_prompt("interview_prompt.txt")

        
        # -------------------------
        # Start Interview
        # -------------------------

        start_prompt = build_prompt(
            config=self.config,
            system_prompt=self.system_prompt,
            history=self.memory.get_history(),
            start_interview=True
        )

        response = self.llm.generate(start_prompt)

        self.memory.add_assistant_message(response)

        print("\nAI:\n")
        print(response)

        # -------------------------
        # Conversation Loop
        # -------------------------

        while True:

            user_input = input("\nYou: ")

            if user_input.lower() == "exit":

                print("\nGenerating Interview Report...\n")

                report_system_prompt = load_prompt("report_prompt.txt")

                report_prompt = build_report_prompt(
                    report_system_prompt,
                    self.memory.get_history()
                )

                report = self.llm.generate(report_prompt)

                print("=" * 60)
                print("FINAL INTERVIEW REPORT")
                print("=" * 60)
                print(report)

                print("\nInterview Ended.\n")

                break

            self.memory.add_user_message(user_input)

            rag_context = ""

            if self.config.interview_type == "PDF Based":
                rag_context = self.rag.retrieve(user_input)

            prompt = build_prompt(
                config=self.config,
                system_prompt=self.system_prompt,
                history=self.memory.get_history(),
                rag_context=rag_context,
                start_interview=False
            )

            response = self.llm.generate(prompt)

            self.memory.add_assistant_message(response)

            print("\nAI:\n")
            print(response)