from app.core.config import MONGODB_CONNECTION_STRING
from pymongo import MongoClient
import certifi
import logging
import os

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

URI = MONGODB_CONNECTION_STRING

def get_mongodb_client():
    """Create and return MongoDB client with error handling"""
    if not URI:
        raise ValueError("MONGODB_CONNECTION_STRING environment variable is not set")
    
    try:
        # Determine TLS settings
        tls_env = os.getenv("MONGODB_TLS", "auto").lower()  # values: auto|true|false
        uri_lower = URI.lower()
        should_use_tls = False
        if tls_env == "true":
            should_use_tls = True
        elif tls_env == "false":
            should_use_tls = False
        else:
            # auto: infer from URI
            # Atlas SRV typically requires TLS; also respect query params if present
            should_use_tls = (
                URI.startswith("mongodb+srv://") or
                "tls=true" in uri_lower or
                "ssl=true" in uri_lower
            )

        client_kwargs = {
            "serverSelectionTimeoutMS": 5000,  # 5 seconds
            "connectTimeoutMS": 5000,
        }
        if should_use_tls:
            client_kwargs.update({
                "tls": True,
                "tlsCAFile": certifi.where(),
            })
            logger.info("MongoDB client TLS mode: ENABLED")
        else:
            logger.info("MongoDB client TLS mode: DISABLED")

        client = MongoClient(URI, **client_kwargs)
        
        # Test the connection
        client.server_info()
        logger.info("Successfully connected to MongoDB")
        return client
        
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {str(e)}")
        raise

def get_database():
    """Get database instance with error handling"""
    try:
        client = get_mongodb_client()
        return client["test"]
    except Exception as e:
        logger.error(f"Failed to get database: {str(e)}")
        raise

# Initialize connections with error handling
try:
    client = get_mongodb_client()
    db = get_database()
    topics_collection = db["topicss_collection"]
    repos_collection = db['reposs_collection']
    logger.info("MongoDB collections initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize MongoDB: {str(e)}")
    # Set to None so the application can handle the error gracefully
    client = None
    db = None
    topics_collection = None
    repos_collection = None