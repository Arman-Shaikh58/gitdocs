from langchain.tools import StructuredTool
from pydantic import BaseModel
import os
from typing import List,Dict 
from pathlib import Path
from langchain.tools import Tool

TOOLS=[
    
]

@Tool
def read_files_content(filesName : List[str]) -> Dict[str, str]:
    """
    Use this tool for getting the content from the files.
    Args : List of file paths
    Return : A dict of file name and file content
    """

    file_content = {}
    for file in filesName:
        with open(file=file, mode="r") as f:
            content = f.read()
            file_content[file] = content
    return file_content

@Tool
def read_folder_structure(folderPath : str = ".") -> List[str]:
    """
    Use this tool for listing the files in the given folder.
    Args : Folder Path to traverse
    Returns : List of file paths
    """
    folderPath = Path(folderPath)

    exclude_dirs = {'.env', '.venv', 'venv', '__pycache__', '.gitignore', '.git', '.vscode'}

    files_list = []

    for root,files in os.walk(folderPath):
        for file in files:
            if any(ex in root for ex in exclude_dirs):
                continue
            if file.startswith('.'):
                continue
            files_list.append(os.path.join(root, file))

    return files_list