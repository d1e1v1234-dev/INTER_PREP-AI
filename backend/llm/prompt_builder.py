from pathlib import Path

PROMPT_DIR = Path(__file__).parent.parent / "prompts"

def load_prompt(filename : str) -> str:
    with open(PROMPT_DIR / filename , "r",encoding="utf-8") as f:
        return f.read()
    
def build_prompt(system_prompt : str ,conversation_history:list) -> str:
    history = ""

    for message in conversation_history:
        history += f"{message['role'].capitalize()}: {message['content']}\n"


    prompt =  f"""
{system_prompt}

Conversation Memory:
{history}

Current User Message: it is the last user message in conversation history(before this line)

Continue the interview naturally.
Do not restart the interview.
Ask only one question at a time.
"""
    return prompt