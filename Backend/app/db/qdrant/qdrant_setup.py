from qdrant_client import QdrantClient
from app.core.config import QDRANT_API_KEY,QDRANT_ENDPOINT

client = QdrantClient(
    api_key=QDRANT_API_KEY,
    url=QDRANT_ENDPOINT,
    timeout=60
)

