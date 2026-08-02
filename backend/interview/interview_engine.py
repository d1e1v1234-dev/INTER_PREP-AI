from backend.llm.gemini import GeminiLLM
from backend.llm.prompt_builder import load_prompt,build_prompt

class InterviewEngine:
    def __init__(self):
        self.llm = GeminiLLM()
        self.system_prompt = load_prompt("ml_prompt.txt")

    def start(self):
        print("=" * 60)
        print("Welcome to INTER_PREP AI")
        print("=" * 60)

        while True:
            user_input = input("\nYou: ")

            if(user_input.lower() == "exit"):
                break
            prompt = build_prompt(self.system_prompt, user_input)

            response = self.llm.generate(prompt)

            print("\nAI:\n")
            print(response)

def main():
    llm = GeminiLLM()

    system_prompt = load_prompt("ml_prompt.txt")

    print("=" * 60)
    print("Welcome to INTER_PREP AI")
    print("=" * 60)

    user_message = input("You: ")

    prompt = build_prompt(system_prompt, user_message)

    response = llm.generate(prompt)

    print("\nAI:\n")
    print(response)


if __name__ == "__main__":
    main()