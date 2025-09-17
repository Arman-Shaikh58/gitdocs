from fastapi import APIRouter, Request, HTTPException
from firebase import verify_token
from datetime import datetime
from pymongo.errors import PyMongoError
from DB import users
import uuid

router = APIRouter()

# 🔐 Add Password Route
@router.post('/passwords')
async def add_password(request: Request):
    try:
        body = await request.json()
        decoded_user = verify_token(request.headers.get("Authorization"))
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    try:
        password_data = {
            'id': str(uuid.uuid4()),  # ✅ Unique ID
            'title': body.get("title"),
            'username': body.get("username"),
            'iv': body.get('iv'),
            'ciphertext': body.get('ciphertext'),
            'url': body.get("url"),
            'createdAt': datetime.utcnow()
        }

        if not all([password_data['title'], password_data['username'], password_data['iv'], password_data['ciphertext']]):
            raise HTTPException(status_code=400, detail="Missing required fields: title, username, or password.")

        user_uid = decoded_user.get('uid')
        if not user_uid:
            raise HTTPException(status_code=401, detail="Invalid or missing user UID.")

        user = users.find_one({'uid': user_uid})

        if not user:
            users.insert_one({
                'uid': user_uid,
                'email': decoded_user.get("email"),
                'username': decoded_user.get("displayName") or decoded_user.get("username") or "Guest",
                'createAt': datetime.utcnow(),
                'passwords': [password_data],
                'apiKeys': []
            })
        else:
            users.update_one(
                {'uid': user_uid},
                {'$push': {'passwords': password_data}}
            )

    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

    return {'status': 200, "message": 'Password added successfully'}


# 🔐 Add API Key Route
@router.post('/apikeys')
async def add_apikey(request: Request):
    try:
        body = await request.json()
        decoded_user = verify_token(request.headers.get("Authorization"))
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    try:
        api_key_data = {
            'id': str(uuid.uuid4()),  # ✅ Unique ID
            'title': body.get("title"),
            'iv': body.get('iv'),
            'ciphertext': body.get('ciphertext'),
            'description': body.get("description"),
            'url': body.get("url"),
            'createdAt': datetime.utcnow()
        }

        if not all([api_key_data['title'], api_key_data['iv'], api_key_data['ciphertext']]):
            raise HTTPException(status_code=400, detail="Missing required fields: title or key.")

        user_uid = decoded_user.get('uid')
        if not user_uid:
            raise HTTPException(status_code=401, detail="Invalid or missing user UID.")

        user = users.find_one({'uid': user_uid})

        if not user:
            users.insert_one({
                'uid': user_uid,
                'email': decoded_user.get("email"),
                'username': decoded_user.get("displayName") or decoded_user.get("username") or "Guest",
                'createAt': datetime.utcnow(),
                'passwords': [],
                'apiKeys': [api_key_data]
            })
        else:
            users.update_one(
                {'uid': user_uid},
                {'$push': {'apiKeys': api_key_data}}
            )

    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

    return {'status': 200, "message": 'API key added successfully'}


@router.post("/delete-password")
async def delete_password(request: Request):
    try:
        body = await request.json()
        decoded_user = verify_token(request.headers.get("Authorization"))
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    password_id = body.get("id")
    if not password_id:
        raise HTTPException(status_code=400, detail="Missing password ID")

    user_uid = decoded_user.get("uid")
    if not user_uid:
        raise HTTPException(status_code=401, detail="Invalid user")

    try:
        result = users.update_one(
            {"uid": user_uid},
            {"$pull": {"passwords": {"id": password_id}}}
        )

        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Password not found")

    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    return {"status": 200, "message": "Password deleted successfully"}

@router.post("/delete-apikey")
async def delete_apikey(request: Request):
    try:
        body = await request.json()
        decoded_user = verify_token(request.headers.get("Authorization"))
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    api_id = body.get("id")
    if not api_id:
        raise HTTPException(status_code=400, detail="Missing API key ID")

    user_uid = decoded_user.get("uid")
    if not user_uid:
        raise HTTPException(status_code=401, detail="Invalid user")

    try:
        result = users.update_one(
            {"uid": user_uid},
            {"$pull": {"apiKeys": {"id": api_id}}}
        )

        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="API key not found")

    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    return {"status": 200, "message": "API key deleted successfully"}

