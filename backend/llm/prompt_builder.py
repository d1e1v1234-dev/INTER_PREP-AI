from pathlib import Path
from backend.interview.interview_config import InterviewConfig

PROMPT_DIR = Path(__file__).parent.parent / "prompts"


def load_prompt(filename: str) -> str:
    with open(PROMPT_DIR / filename, "r", encoding="utf-8") as f:
        return f.read()


def build_prompt(
    config: InterviewConfig,
    system_prompt: str,
    history: list,
    start_interview: bool = False
) -> str:
    system_prompt = system_prompt.format(
        INTERVIEW_TYPE=config.interview_type,
        DIFFICULTY=config.difficulty
    )
    history_text = ""

    for message in history:
        history_text += (
            f"{message['role'].capitalize()}: "
            f"{message['content']}\n"
        )

    if start_interview:
        instruction = """
The interview is starting now.

1. Welcome the candidate briefly.
2. Explain that you will ask one question at a time.
3. Start directly with the first interview question.
4. Do not provide answers.
5. Do not ask multiple questions.
"""
    else:
        instruction = """
Continue the interview naturally.

1. Evaluate the candidate's previous answer.
2. Correct grammar only if needed.
3. Give short constructive feedback.
4. Ask ONE follow-up or next question.
5. Do not restart the interview.
"""

    prompt = f"""
{system_prompt}

==============================
INTERVIEW CONFIGURATION
==============================

Interview Type:
{config.interview_type}

Difficulty:
{config.difficulty}

==============================
CONVERSATION HISTORY
==============================

{history_text}

==============================
CURRENT INSTRUCTION
==============================

{instruction}
"""

    return prompt

def build_report_prompt(report_prompt: str, history: list) -> str:

    history_text = ""

    for message in history:
        history_text += (
            f"{message['role'].capitalize()}: "
            f"{message['content']}\n"
        )

    return f"""
{report_prompt}

Interview Conversation:

{history_text}
"""