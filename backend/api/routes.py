from fastapi import APIRouter, UploadFile, File
from backend.api.schemas import StartInterviewRequest, ChatRequest
from backend.interview.interview_engine import InterviewEngine

router = APIRouter()

engine = InterviewEngine()


@router.post("/start-interview")
def start_interview(request: StartInterviewRequest):

    response = engine.start_interview(
        interview_type=request.interview_type,
        difficulty=request.difficulty
    )

    return {
        "response": response
    }


@router.post("/chat")
def chat(request: ChatRequest):

    response = engine.chat(request.message)

    return {
        "response": response
    }


@router.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):

    pdf_path = f"backend/uploads/{file.filename}"

    with open(pdf_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    message = engine.upload_pdf(pdf_path)

    return {
        "message": message
    }


@router.post("/end-interview")
def end_interview():

    report = engine.end_interview()

    return {
        "report": report
    }