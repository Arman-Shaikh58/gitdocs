from fastapi import APIRouter,HTTPException
from pydantic import BaseModel
import requests
import os
import uuid
from app.db.mongoDB.mongo import repos_collection
from app.db.chromaDB.chroma import chroma_client
from app.utils.embeddor import create_embedding
router = APIRouter()
import time




# Pydantic model for input
class GitURLInput(BaseModel):
    owner: str
    repo: str

def fetch_and_save(owner, repo, path="", local_dir=None, branch="main"):
    """
    Recursively fetch files from GitHub repo and save locally
    """
    base_url = f"https://api.github.com/repos/{owner}/{repo}/contents/{path}?ref={branch}"
    response = requests.get(base_url)

    if response.status_code == 404:
        print(f"404 Not Found: {base_url}")
        return
    elif response.status_code != 200:
        print(f"Failed ({response.status_code}): {response.text}")
        return

    contents = response.json()
    if local_dir is None:
        local_dir = repo

    os.makedirs(local_dir, exist_ok=True)

    for item in contents:
        item_path = item["path"]
        if item["type"] == "file":
            file_resp = requests.get(item["download_url"])
            if file_resp.status_code == 200:
                file_local_path = os.path.join(local_dir, os.path.basename(item_path))
                with open(file_local_path, "w", encoding="utf-8") as f:
                    f.write(file_resp.text)
                print("Saved file:", file_local_path)
        elif item["type"] == "dir":
            new_local_dir = os.path.join(local_dir, os.path.basename(item_path))
            fetch_and_save(owner, repo, item_path, new_local_dir, branch )

def create_embeddings(folder_name: str, chunk_size: int = 500, chunk_overlap: int = 50):
    """
    Embed every file in the folder structure, breaking large files into chunks.
    
    Args:
        folder_name: Root folder of the downloaded repo.
        chunk_size: Number of characters per chunk.
        chunk_overlap: Number of overlapping characters between chunks.
    """
    # Create a Chroma collection for this repo
    collection = chroma_client.create_collection(name=folder_name)

    # Walk through all files recursively
    for root, dirs, files in os.walk(folder_name):
        for file_name in files:
            file_path = os.path.join(root, file_name)

            try:
                # Read file content
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()

                if not content.strip():
                    continue  # skip empty files

                # Break content into chunks
                start = 0
                chunks = []
                while start < len(content):
                    end = min(start + chunk_size, len(content))
                    chunk = content[start:end]
                    chunks.append(chunk)
                    start += chunk_size - chunk_overlap  # move start with overlap

                # Embed and store each chunk
                for i, chunk in enumerate(chunks):
                    time.sleep(0.2)
                    embedding = create_embedding(chunk)  # or embeddor.encode(chunk)
                    collection.add(
                        ids=str(uuid.uuid4()),
                        documents=[chunk],
                        embeddings=[embedding],
                        metadatas=[{
                            "file_path": file_path,
                            "chunk_index": i
                        }]
                    )

                print(f"Embedded {len(chunks)} chunks for: {file_path}")

            except Exception as e:
                print(f"Failed to embed {file_path}: {e}")




@router.post(
    "/fetch_repo",
    summary="Download a GitHub Repository",
    description="""
    This endpoint downloads all files from a GitHub repository.

    - **owner** → GitHub username or organization  
    - **repo** → Repository name  
    - **token** → Optional GitHub Personal Access Token (for private repos)
    """
)
def work_on_repo(data: GitURLInput):
    print("getting repo")
    # Get repo info to detect default branch
    repo_url = f"https://api.github.com/repos/{data.owner}/{data.repo}"
    repo_resp = requests.get(repo_url)
    print("reponse",repo_resp.status_code)
    if repo_resp.status_code == 404:
        raise HTTPException(status_code=404, detail="Repository not found")
    elif repo_resp.status_code != 200:
        raise HTTPException(status_code=repo_resp.status_code, detail=repo_resp.text)

    default_branch = repo_resp.json().get("default_branch", "main")

    # Fetch and save files
    dir_name=data.owner+'_'+data.repo
    fetch_and_save(
        owner=data.owner,
        repo=data.repo,
        branch=default_branch,
        local_dir=dir_name
    )
    repos_collection.insert_one({'repo_name':data.repo,"repo_owner":data.owner})
    create_embeddings(folder_name=dir_name)

    return {"status": 200, "message": f"Repository '{data.repo}' downloaded successfully"}