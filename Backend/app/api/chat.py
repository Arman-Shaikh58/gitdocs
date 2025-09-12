from fastapi import APIRouter

router = APIRouter()

@router.post('/{owner}/{repo_name}')
def chat_about_repo(owner:str,repo_name:str):
    pass