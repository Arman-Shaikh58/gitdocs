from app.core.config import MONGODB_CONNECTION_STRING
from pymongo import MongoClient

client =MongoClient(MONGODB_CONNECTION_STRING)

db= client['gitdocs']
topics_collection= db["topics_collection"]