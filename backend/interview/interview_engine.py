from backend.llm.gemini import GeminiLLM
from backend.llm.prompt_builder import load_prompt,build_prompt
from backend.memory.conversation_memory import ConversationMemory

class InterviewEngine:
    def __init__(self):
        self.llm = GeminiLLM()
        self.system_prompt = load_prompt("ml_prompt.txt")
        self.memory = ConversationMemory()
    def start(self):
        print("=" * 60)
        print("Welcome to INTER_PREP AI")
        print("=" * 60)

        while True:
            user_input = input("\nYou: ")

            if(user_input.lower() == "exit"):
                break

            self.memory.add_user_message(user_input)
            prompt = build_prompt(self.system_prompt,self.memory.get_history())

            response = self.llm.generate(prompt)
            self.memory.add_assistant_message(response)
            print("\nAI:\n")
            print(response)

