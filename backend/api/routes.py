from fastapi import APIRouter
from backend.api.schemas import (
    StartInterviewRequest,
    ChatRequest,
    UploadPDFRequest,
)
from backend.interview.interview_engine import InterviewEngine

router = APIRouter()

engine = InterviewEngine()


@router.post("/start-interview")
def start_interview(request: StartInterviewRequest):

    response = engine.start_interview(
        interview_type=request.interview_type,
        difficulty=request.difficulty,
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
def upload_pdf(request: UploadPDFRequest):

    message = engine.upload_pdf(request.pdf_path)

    return {
        "message": message
    }


@router.post("/end-interview")
def end_interview():

    report = engine.end_interview()

    return {
        "report": report
    }