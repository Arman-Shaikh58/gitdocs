from langchain.tools.base import StructuredTool
from pydantic import BaseModel
import os
from typing import List, Dict 
from pathlib import Path
from app.db.chromaDB.chroma import chroma_client
from app.utils.embeddor import create_embedding

def read_files_content(filesName: List[str]) -> Dict[str, str]:
    """
    Use this tool for getting the content from the files.
    Args: List of file paths
    Returns: A dict of file name and file content
    """
    file_content = {}
    for file in filesName:
        with open(file=file, mode="r") as f:
            content = f.read()
            file_content[file] = content
    return file_content


def read_folder_structure(folderPath: str = ".") -> List[str]:
    """
    Use this tool for listing the files in the given folder.
    Args: Folder Path to traverse
    Returns: List of file paths
    """
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
        collection = chroma_client.get_collection(name=collection_name)

        # Convert query to embedding
        query_vector = create_embedding(query)

        # Query Chroma
        results = collection.query(
            query_embeddings=[query_vector],
            n_results=k
        )

        # Extract documents (contexts)
        contexts = results.get("documents", [[]])[0]

        return contexts

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
    description="Read and return the content of files from given file paths."
)

read_folder_structure_tool = StructuredTool.from_function(
    name="read_folder_structure",
    func=read_folder_structure,
    description="List all file paths inside a given folder (excluding hidden/system files and common ignored folders)."
)


# Collect tools
TOOLS = [
    get_context_tool,
    read_files_content_tool,
    read_folder_structure_tool
]

TOOLS_DESC = [{'name': t.name, 'description': t.description} for t in TOOLS]
