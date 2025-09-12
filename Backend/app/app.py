from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import chat, giturl

# Create app instance
app = FastAPI(
    title="GitDocs Backend",
    description="This project gives awesome",
    version="1.0.0"
)

# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],
)

# Register routers
app.include_router(chat.router, prefix="/api/chat")
app.include_router(giturl.router, prefix="/api/giturl")
