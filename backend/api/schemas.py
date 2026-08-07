from pydantic import BaseModel

class StartInterviewRequest(BaseModel):
    interview_type : str
    difficulty: str

class ChatRequest(BaseModel):
    message:str

class UploadPDFRequest(BaseModel):
    pdf_path : str

