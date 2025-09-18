from langchain.tools.base import StructuredTool
from pydantic import BaseModel
import os
from typing import List, Dict, Optional 
from pathlib import Path
from app.db.qdrant.qdrant_setup import client
from app.utils.embeddor import create_embedding

def read_files_content(filesName: List[str], repo_context: Optional[str] = None) -> Dict[str, str]:
    """
    Use this tool for getting the content from the files.
    Args:
        filesName: List of file paths (absolute or relative to repository root)
        repo_context: Optional repository context in format 'owner_repo'. When provided,
                      relative paths are resolved under 'Repos/{owner_repo}'.
    Returns: A dict of file name and file content
    """
    file_content = {}
    # Define excluded extensions (images, pdf, etc)
    excluded_exts = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.svg', '.webp', '.ico', '.pdf'}
    
    for file in filesName:
        ext = os.path.splitext(file)[1].lower()
        if ext in excluded_exts:
            file_content[file] = f"Skipped: {ext} files are not supported"
            continue
            
        try:
            # Handle both absolute and relative paths
            file_path = file
            
            # If the path doesn't exist as-is, try repo-aware resolution then CWD
            if not os.path.isabs(file_path) and repo_context:
                repo_root = os.path.join("Repos", repo_context)
                candidate = os.path.join(repo_root, file)
                if os.path.exists(candidate):
                    file_path = candidate
                else:
                    # Also try normalizing removing leading './' or '/' artifacts
                    candidate2 = os.path.normpath(os.path.join(repo_root, file.lstrip("/\\")))
                    if os.path.exists(candidate2):
                        file_path = candidate2
            
            # If repo_context is not provided, try to auto-detect by searching under Repos/*
            if not os.path.exists(file_path) and not os.path.isabs(file_path) and not repo_context:
                repos_dir = "Repos"
                if os.path.isdir(repos_dir):
                    matches = []
                    try:
                        for entry in os.listdir(repos_dir):
                            repo_root = os.path.join(repos_dir, entry)
                            if not os.path.isdir(repo_root):
                                continue
                            candidate = os.path.join(repo_root, file)
                            if os.path.exists(candidate):
                                matches.append(candidate)
                            else:
                                candidate2 = os.path.normpath(os.path.join(repo_root, file.lstrip("/\\")))
                                if os.path.exists(candidate2):
                                    matches.append(candidate2)
                    except Exception:
                        # ignore auto-detect errors and fall back to default behavior
                        matches = []
                    if len(matches) == 1:
                        file_path = matches[0]
                    elif len(matches) > 1:
                        file_content[file] = (
                            "Error: File path is ambiguous across multiple repositories. "
                            f"Found {len(matches)} matches under 'Repos/*'. Please specify repo_context."
                        )
                        continue
            
            if not os.path.exists(file_path):
                # Try current working directory as a fallback
                cwd_candidate = os.path.join(".", file)
                if os.path.exists(cwd_candidate):
                    file_path = cwd_candidate
                else:
                    file_content[file] = f"Error: File not found. Looked for '{file}' and under repo_context '{repo_context}'"
                    continue
            
            # Read file with proper encoding handling
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
                file_content[file] = content
                
        except PermissionError:
            file_content[file] = f"Error: Permission denied for file '{file}'"
        except IsADirectoryError:
            file_content[file] = f"Error: '{file}' is a directory, not a file"
        except Exception as e:
            file_content[file] = f"Error reading file '{file}': {str(e)}"
            
    return file_content


def read_folder_structure(folderPath: str = ".", repo_context: str = None) -> List[str]:
    """
    Use this tool for listing the files in the given folder.
    Args: 
        folderPath: Folder Path to traverse (defaults to current directory)
        repo_context: Repository context in format 'owner_repo' to use Repos folder
    Returns: List of file paths
    """
    # If repo_context is provided, use the Repos folder structure
    if repo_context:
        folderPath = os.path.join("Repos", repo_context)
        if not os.path.exists(folderPath):
            return [f"Repository '{repo_context}' not found in Repos folder"]
    
    folderPath = Path(folderPath)

    exclude_dirs = {'.env', '.venv', 'venv', '__pycache__', '.gitignore', '.git', '.vscode'}

    files_list = []

    for root, dirs, files in os.walk(folderPath):
        for file in files:
            if any(ex in root for ex in exclude_dirs):
                continue
            if file.startswith('.'):
                continue
            files_list.append(os.path.join(root, file))

    return files_list


def get_context(collection_name: str, query: str, k: int = 3) -> List[str]:
    """
    Retrieve top-k relevant contexts from ChromaDB for the given query.
    """
    try:
        # Load the collection
        collection = client.get_collection(collection_name=collection_name)

        # Convert query to embedding
        query_vector = create_embedding(query)

        # Query Qdrant
        results = client.search(
            collection_name=collection_name,
            query_vector=query_vector,
            limit=k,
            with_payload=True,
        )

        # Extract documents (contexts)
        # contexts = results.get("documents", [[]])[0]

        return results

    except Exception as e:
        print(f"Error retrieving context: {e}")
        return []


# Wrap functions as StructuredTool
get_context_tool = StructuredTool.from_function(
    name="get_context",
    func=get_context,
    description="Retrieve the most relevant text snippets from a ChromaDB collection for a given natural language query."
)

read_files_content_tool = StructuredTool.from_function(
    name="read_files_content",
    func=read_files_content,
    description="Read and return the content of files from given file paths. Handles both absolute and relative paths, provides detailed error messages for inaccessible files, and skips unsupported file types. If reading files from a downloaded repository under 'Repos/{owner_repo}', pass repo_context='owner_repo' so relative paths resolve correctly. If repo_context is omitted, the tool will attempt to auto-detect the correct repo under 'Repos/' and will error if multiple matches are found."
)

read_folder_structure_tool = StructuredTool.from_function(
    name="read_folder_structure",
    func=read_folder_structure,
    description="List all file paths inside a given folder (excluding hidden/system files and common ignored folders). Use repo_context parameter with 'owner_repo' format to list files from downloaded repositories (under 'Repos/{owner_repo}')."
)


# Collect tools
TOOLS = [
    get_context_tool,
    read_files_content_tool,
    read_folder_structure_tool
]

TOOLS_DESC = [{'name': t.name, 'description': t.description} for t in TOOLS]
