#!/usr/bin/env python3
"""
Test script to diagnose MongoDB connection issues
"""
import sys
import os
from dotenv import load_dotenv
from pymongo import MongoClient
import certifi

# Load environment variables
load_dotenv()

def test_mongodb_connection():
    """Test MongoDB connection and diagnose issues"""
    print("🔍 Testing MongoDB Connection...")
    print("=" * 50)
    
    # Get connection string from environment
    mongodb_uri = os.getenv("MONGODB_CONNECTION_STRING")
    
    if not mongodb_uri:
        print("❌ ERROR: MONGODB_CONNECTION_STRING not found in environment variables")
        print("   Please check your .env file contains:")
        print("   MONGODB_CONNECTION_STRING=your_mongodb_connection_string")
        return False
    
    print(f"✅ Found MongoDB URI in environment (length: {len(mongodb_uri)} chars)")
    
    # Mask sensitive parts of URI for logging
    masked_uri = mongodb_uri
    if "@" in mongodb_uri:
        parts = mongodb_uri.split("@")
        if len(parts) >= 2:
            # Mask password part
            auth_part = parts[0]
            if ":" in auth_part:
                user_pass = auth_part.split(":")
                if len(user_pass) >= 2:
                    masked_uri = f"{user_pass[0]}:***@{parts[1]}"
    
    print(f"📍 Connection URI: {masked_uri}")
    
    try:
        print("\n🔗 Attempting to create MongoDB client...")
        
        # Create client with SSL/TLS settings
        client = MongoClient(
            mongodb_uri, 
            tls=True, 
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=5000,  # 5 second timeout
            connectTimeoutMS=5000
        )
        
        print("✅ MongoDB client created successfully")
        
        # Test connection by getting server info
        print("\n🏓 Testing server connection...")
        server_info = client.server_info()
        print(f"✅ Connected to MongoDB server version: {server_info.get('version', 'Unknown')}")
        
        # Test database access
        print("\n📊 Testing database access...")
        db = client["test"]
        print(f"✅ Accessed database: {db.name}")
        
        # Test collections
        print("\n📁 Testing collections access...")
        topics_collection = db["topicss_collection"]
        repos_collection = db['reposs_collection']
        
        # Try to get collection stats (this will fail if no permissions)
        try:
            topics_count = topics_collection.estimated_document_count()
            repos_count = repos_collection.estimated_document_count()
            print(f"✅ Topics collection: {topics_count} documents")
            print(f"✅ Repos collection: {repos_count} documents")
        except Exception as e:
            print(f"⚠️  Could not get collection stats: {e}")
            print("   This might be due to permissions or empty collections")
        
        print("\n🎉 MongoDB connection test PASSED!")
        return True
        
    except Exception as e:
        print(f"\n❌ MongoDB connection FAILED!")
        print(f"   Error type: {type(e).__name__}")
        print(f"   Error message: {str(e)}")
        
        # Provide specific troubleshooting based on error type
        error_str = str(e).lower()
        
        if "authentication failed" in error_str:
            print("\n🔧 TROUBLESHOOTING:")
            print("   - Check your username and password in the connection string")
            print("   - Ensure the user has proper database permissions")
            print("   - Verify the authentication database is correct")
            
        elif "network" in error_str or "timeout" in error_str:
            print("\n🔧 TROUBLESHOOTING:")
            print("   - Check your internet connection")
            print("   - Verify the MongoDB server is running and accessible")
            print("   - Check if firewall is blocking the connection")
            print("   - Ensure the correct hostname/port in connection string")
            
        elif "ssl" in error_str or "tls" in error_str:
            print("\n🔧 TROUBLESHOOTING:")
            print("   - SSL/TLS configuration issue")
            print("   - Try updating the certifi package: pip install --upgrade certifi")
            print("   - Check if your MongoDB requires specific SSL settings")
            
        elif "dns" in error_str:
            print("\n🔧 TROUBLESHOOTING:")
            print("   - DNS resolution failed")
            print("   - Check the hostname in your connection string")
            print("   - Try using IP address instead of hostname")
            
        else:
            print("\n🔧 GENERAL TROUBLESHOOTING:")
            print("   - Verify your .env file is in the correct location")
            print("   - Check the MongoDB connection string format")
            print("   - Ensure MongoDB server is running")
            print("   - Check network connectivity")
        
        return False
    
    finally:
        try:
            client.close()
            print("\n🔒 MongoDB client connection closed")
        except:
            pass

if __name__ == "__main__":
    print("MongoDB Connection Diagnostic Tool")
    print("==================================")
    
    success = test_mongodb_connection()
    
    if success:
        print("\n✅ All tests passed! Your MongoDB connection is working.")
        sys.exit(0)
    else:
        print("\n❌ MongoDB connection failed. Please check the troubleshooting steps above.")
        sys.exit(1)
