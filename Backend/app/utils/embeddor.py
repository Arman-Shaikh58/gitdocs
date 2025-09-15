
from openai import AzureOpenAI
from app.core.config import AZURE_OPENAI_API_KEY,AZURE_OPENAI_ENDPOINT

Azure_client = AzureOpenAI(
    api_key=AZURE_OPENAI_API_KEY,
    api_version="2024-12-01-preview",
    azure_endpoint=AZURE_OPENAI_ENDPOINT
)

def create_embedding(query:str):
    query_vector = Azure_client.embeddings.create(
            model="text-embedding-3-large",
            input=query
        ).data[0].embedding
    
    return query_vector