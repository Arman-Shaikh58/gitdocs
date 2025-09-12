from fastapi import APIRouter

router = APIRouter()

@router.post(
    "/{owner}/{repo_name}",
    summary="Work on a GitHub Repository",
    description="""
    This endpoint lets you perform operations on a GitHub repository.

    - **owner** → GitHub username or organization  
    - **repo_name** → Repository name  
    """
)
def work_on_repo(owner: str, repo_name: str):
    return {"owner": owner, "repo_name": repo_name}
