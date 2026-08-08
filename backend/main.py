from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.routes import router
from backend.api.auth_routes import router as auth_router

from backend.database.database import Base, engine
from backend.database import models


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="INTER_PREP AI"
)


app.add_middleware(
    CORSMiddleware,

    allow_origins=["*"],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


app.include_router(auth_router)

app.include_router(router)