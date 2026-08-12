import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.routes import router
from backend.api.auth_routes import router as auth_router

from backend.database.database import Base, engine
from backend.database import models
from backend.voice.routes import router as voice_router

Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="INTER_PREP AI"
)


# Comma-separated list of allowed origins, e.g.
# ALLOWED_ORIGINS="https://myapp.vercel.app,https://myapp.com"
# Defaults to "*" so local development keeps working unchanged.
_allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "*")

allowed_origins = (
    ["*"]
    if _allowed_origins_env.strip() == "*"
    else [
        origin.strip()
        for origin in _allowed_origins_env.split(",")
        if origin.strip()
    ]
)

app.add_middleware(
    CORSMiddleware,

    allow_origins=allowed_origins,

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


app.include_router(auth_router)

app.include_router(router)

app.include_router(voice_router)