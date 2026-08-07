# from backend.interview.interview_engine import InterviewEngine
# def main():
#     engine = InterviewEngine()
#     engine.start()

# if __name__ == "__main__":
#     main()

from fastapi import FastAPI
from backend.api.routes import router

app = FastAPI(title="INTER_PREP AI")

app.include_router(router)