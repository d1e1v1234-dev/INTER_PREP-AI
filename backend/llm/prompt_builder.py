from pathlib import Path

PROMPT_DIR = Path(__file__).parent.parent / "prompts"

def load_prompt(filename : str) -> str:
    with open(PROMPT_DIR / filename , "r",encoding="utf-8") as f:
        return f.read()
    
def build_prompt(system_prompt : str , user_message : str) -> str:
    return f"""
{system_prompt}

Candidate:
{user_message}
"""