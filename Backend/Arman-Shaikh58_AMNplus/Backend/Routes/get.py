from fastapi import APIRouter,Request,HTTPException
from firebase import verify_token
from DB import users
router=APIRouter()

@router.get('/passwords')
async def get_passwords(request: Request):
    try:
        decoded_user = verify_token(request.headers.get("Authorization"))
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    try:
        user = users.find_one({'uid': decoded_user.get('uid')})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return {
            "status": 200,
            "passwords": user.get('passwords', [])
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")
    
@router.get('/apikeys')
async def get_apikeys(request: Request):
    try:
        decoded_user = verify_token(request.headers.get("Authorization"))
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    try:
        user = users.find_one({'uid': decoded_user.get('uid')})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return {
            "status": 200,
            "apiKeys": user.get('apiKeys', [])
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")
    
@router.get("/password/{id}")
async def get_password_by_id(id: str, request: Request):
    try:
        decoded_user = verify_token(request.headers.get("Authorization"))
        user_uid = decoded_user.get("uid")
        if not user_uid:
            raise HTTPException(status_code=401, detail="Invalid user")

        user = users.find_one({"uid": user_uid}, {"passwords": 1})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        for p in user.get("passwords", []):
            if p.get("id") == id:
                return {"status": 200, "password": p}

        raise HTTPException(status_code=404, detail="Password not found")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/apikey/{id}")
async def get_apikey_by_id(id: str, request: Request):
    try:
        decoded_user = verify_token(request.headers.get("Authorization"))
        user_uid = decoded_user.get("uid")

        user = users.find_one({"uid": user_uid}, {"apiKeys": 1})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        for key in user.get("apiKeys", []):
            if key.get("id") == id:
                return {"status": 200, "apikey": key}

        raise HTTPException(status_code=404, detail="API key not found")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    
@router.post("/edit-password")
async def edit_password(request: Request):
    try:
        body = await request.json()
        decoded_user = verify_token(request.headers.get("Authorization"))
        user_uid = decoded_user.get("uid")

        if not user_uid or not body.get("id"):
            raise HTTPException(status_code=400, detail="Missing UID or ID")

        update_fields = {
            "title": body.get("title"),
            "username": body.get("username"),
            "iv": body.get("iv"),
            "ciphertext": body.get("ciphertext"),
            "url": body.get("url"),
        }

        result = users.update_one(
            {"uid": user_uid, "passwords.id": body["id"]},
            {"$set": {
                "passwords.$.title": update_fields["title"],
                "passwords.$.username": update_fields["username"],
                "passwords.$.iv": update_fields["iv"],
                "passwords.$.ciphertext": update_fields["ciphertext"],
                "passwords.$.url": update_fields["url"],
            }}
        )

        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Password not found or no changes made")

        return {"status": 200, "message": "Password updated successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/edit-apikey")
async def edit_apikey(request: Request):
    try:
        body = await request.json()
        decoded_user = verify_token(request.headers.get("Authorization"))
        user_uid = decoded_user.get("uid")

        if not user_uid or not body.get("id"):
            raise HTTPException(status_code=400, detail="Missing UID or ID")

        result = users.update_one(
            {"uid": user_uid, "apiKeys.id": body["id"]},
            {"$set": {
                "apiKeys.$.title": body.get("title"),
                "apiKeys.$.iv": body.get("iv"),
                "apiKeys.$.ciphertext": body.get("ciphertext"),
                "apiKeys.$.description": body.get("description"),
                "apiKeys.$.url": body.get("url"),
            }}
        )

        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="API key not found or no changes made")

        return {"status": 200, "message": "API key updated successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
async def get_stats(request: Request):
    try:
        decoded_user = verify_token(request.headers.get("Authorization"))
        uid = decoded_user.get("uid")

        user = users.find_one({"uid": uid})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return {
            "status": 200,
            "total_passwords": len(user.get("passwords", [])),
            "total_apikeys": len(user.get("apiKeys", [])),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


