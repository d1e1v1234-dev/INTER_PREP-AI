import json
import os
import tempfile
from fastapi import (
    APIRouter,
    UploadFile,
    File,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from backend.api.schemas import (
    StartInterviewRequest,
    ChatRequest
)

from backend.interview.interview_engine import InterviewEngine
from backend.interview.interview_config import InterviewConfig
from backend.memory.conversation_memory import ConversationMemory
from backend.llm.prompt_builder import load_prompt

from backend.database.database import get_db
from backend.database.models import Interview

from backend.auth.auth import get_current_user_id
from backend.voice.stt import SpeechToText

router = APIRouter()

stt_model = SpeechToText()


# One interview engine per logged-in user
engines = {}

# Current interview ID for each user
active_interviews = {}


def get_engine(user_id: int):

    if user_id not in engines:

        engines[user_id] = InterviewEngine()

    return engines[user_id]


# =========================
# START INTERVIEW
# =========================

@router.post("/start-interview")
def start_interview(
    request: StartInterviewRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):

    engine = get_engine(user_id)

    response = engine.start_interview(
        interview_type=request.interview_type,
        difficulty=request.difficulty
    )


    # Create DB interview

    interview = Interview(

        user_id=user_id,

        interview_type=request.interview_type,

        difficulty=request.difficulty,

        conversation=json.dumps(
            engine.memory.get_history()
        )

    )


    db.add(interview)

    db.commit()

    db.refresh(interview)


    # Remember current interview

    active_interviews[user_id] = interview.id


    return {

        "interview_id": interview.id,

        "response": response

    }


# =========================
# CHAT
# =========================

@router.post("/chat")
def chat(
    request: ChatRequest,

    user_id: int = Depends(get_current_user_id),

    db: Session = Depends(get_db)
):

    if user_id not in engines:

        raise HTTPException(
            status_code=400,
            detail="No active interview"
        )


    if user_id not in active_interviews:

        raise HTTPException(
            status_code=400,
            detail="No active interview"
        )


    engine = engines[user_id]

    interview_id = active_interviews[user_id]


    response = engine.chat(
        request.message
    )


    # Save conversation

    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == user_id
    ).first()


    if interview:

        interview.conversation = json.dumps(
            engine.memory.get_history()
        )

        db.commit()


    return {
        "response": response
    }


# =========================
# UPLOAD PDF
# =========================

@router.post("/upload-pdf")
async def upload_pdf(
    file: UploadFile = File(...),

    user_id: int = Depends(get_current_user_id)
):

    if not file.filename.lower().endswith(".pdf"):

        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed"
        )


    os.makedirs(
        "backend/uploads",
        exist_ok=True
    )


    pdf_path = (
        f"backend/uploads/"
        f"{user_id}_{file.filename}"
    )


    with open(pdf_path, "wb") as buffer:

        content = await file.read()

        buffer.write(content)


    # Important:
    # create/get user's engine before start-interview

    engine = get_engine(user_id)

    engine.upload_pdf(pdf_path)


    return {

        "message":
            "PDF Uploaded Successfully",

        "filename":
            file.filename

    }


# =========================
# END INTERVIEW
# =========================

@router.post("/end-interview")
def end_interview(
    user_id: int = Depends(get_current_user_id),

    db: Session = Depends(get_db)
):

    if user_id not in engines:

        raise HTTPException(
            status_code=400,
            detail="No active interview"
        )


    if user_id not in active_interviews:

        raise HTTPException(
            status_code=400,
            detail="No active interview"
        )


    engine = engines[user_id]

    interview_id = active_interviews[user_id]


    # Generate report

    report = engine.end_interview()


    # Save report

    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == user_id
    ).first()


    if interview:

        interview.report = report

        interview.conversation = json.dumps(
            engine.memory.get_history()
        )

        db.commit()

    # Mark the interview as finished so the old session
    # cannot continue receiving /chat requests.
    active_interviews.pop(user_id, None)
    engines.pop(user_id, None)

    return {
        "report": report
    }


# =========================
# PREVIOUS INTERVIEWS
# =========================

@router.get("/interviews")
def get_previous_interviews(
    user_id: int = Depends(get_current_user_id),

    db: Session = Depends(get_db)
):

    interviews = (
        db.query(Interview)
        .filter(
            Interview.user_id == user_id
        )
        .order_by(
            Interview.created_at.desc()
        )
        .all()
    )


    return [

        {
            "id": interview.id,

            "interview_type":
                interview.interview_type,

            "difficulty":
                interview.difficulty,

            "pdf_name":
                interview.pdf_name,

            "created_at":
                interview.created_at,

            "has_report":
                bool(interview.report)

        }

        for interview in interviews

    ]


# =========================
# GET ONE OLD INTERVIEW
# =========================

@router.get("/interviews/{interview_id}")
def get_interview(
    interview_id: int,

    user_id: int = Depends(get_current_user_id),

    db: Session = Depends(get_db)
):

    interview = db.query(Interview).filter(

        Interview.id == interview_id,

        Interview.user_id == user_id

    ).first()


    if not interview:

        raise HTTPException(
            status_code=404,
            detail="Interview not found"
        )


    conversation = []

    if interview.conversation:

        conversation = json.loads(
            interview.conversation
        )


    return {

        "id":
            interview.id,

        "interview_type":
            interview.interview_type,

        "difficulty":
            interview.difficulty,

        "pdf_name":
            interview.pdf_name,

        "conversation":
            conversation,

        "report":
            interview.report,

        "created_at":
            interview.created_at

    }

@router.post("/interviews/{interview_id}/resume")
def resume_interview(
    interview_id: int,

    user_id: int = Depends(get_current_user_id),

    db: Session = Depends(get_db)
):

    interview = db.query(Interview).filter(

        Interview.id == interview_id,

        Interview.user_id == user_id

    ).first()


    if not interview:

        raise HTTPException(
            status_code=404,
            detail="Interview not found"
        )


    # Rebuild a live engine for this interview from what we saved in the DB.
    # This works whether the interview was properly ended (has a report) or
    # was just left mid-way (no report yet) — either way we can pick it
    # back up from the saved conversation.

    engine = InterviewEngine()

    engine.config = InterviewConfig(
        interview_type=interview.interview_type,
        difficulty=interview.difficulty
    )

    engine.system_prompt = load_prompt("interview_prompt.txt")

    engine.memory = ConversationMemory()

    if interview.conversation:

        engine.memory.history = json.loads(
            interview.conversation
        )


    if (
        interview.interview_type == "PDF Based"
        and interview.pdf_name
    ):

        pdf_path = (
            f"backend/uploads/"
            f"{user_id}_{interview.pdf_name}"
        )

        if os.path.exists(pdf_path):

            engine.upload_pdf(pdf_path)


    engines[user_id] = engine

    active_interviews[user_id] = interview.id


    # Continuing means the old report (if any) no longer reflects the
    # full conversation, so clear it until the interview is ended again.
    interview.report = None

    db.commit()


    return {

        "interview_id": interview.id,

        "interview_type": interview.interview_type,

        "difficulty": interview.difficulty,

        "conversation": engine.memory.get_history()

    }


@router.post("/voice/transcribe")
async def transcribe_voice(
    file: UploadFile = File(...)
):

    temp_path = None

    try:

        # Create temporary audio file
        suffix = os.path.splitext(
            file.filename or ".webm"
        )[1] or ".webm"

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=suffix
        ) as temp_file:

            content = await file.read()

            temp_file.write(content)

            temp_path = temp_file.name


        # Run Whisper
        text = stt_model.transcribe(
            temp_path
        )


        return {
            "text": text
        }


    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Transcription failed: {str(e)}"
        )


    finally:

        if temp_path and os.path.exists(
            temp_path
        ):

            os.remove(temp_path)