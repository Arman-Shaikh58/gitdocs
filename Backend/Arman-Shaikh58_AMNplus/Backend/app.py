from fastapi import FastAPI,Request,HTTPException
from fastapi.middleware.cors import CORSMiddleware
from Routes import get, post

app=FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        'http://localhost:5173',
        'https://amnplus.netlify.app','https://amnplus.netlify.app'
        ], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],  
)

app.include_router(get.router,prefix='/get')

app.include_router(post.router,prefix='/post')
