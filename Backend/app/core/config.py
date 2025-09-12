from dotenv import load_dotenv
import os

load_dotenv()

GOOGLE_API_KEY=os.getenv('GOOGLE_API_KEY')
GROQ_API_KEY=os.getenv('GROQ_API_KEY')
MONGODB_CONNECTION_STRING=os.getenv("MONGODB_CONNECTION_STRING")