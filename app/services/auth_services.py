import jwt 
from sqlalchemy import select 
from app import models
from datetime import datetime , timezone , timedelta
from app.config.settings import settings

def Get_token(user_id):
    payload = {
        "sub" : str(user_id),
        "exp" : datetime.now(timezone.utc)+timedelta(minutes=15),
        "type" : "access"
    }

    access_token = jwt.encode(payload , settings.JWT_SECRET , algorithm="HS256")
    
    payload["exp"] = datetime.now(timezone.utc)+timedelta(days=7)
    payload["type"] = "refresh"

    refresh_token = jwt.encode(payload , settings.JWT_SECRET , algorithm="HS256")

    refresh = models.Refresh_Token(
        refresh_token = refresh_token,
        user_id = user_id,
        expire_on = payload["exp"]
    )

    return {"access_token" : access_token , "refresh_token" : refresh_token} , refresh

def Verify_access_token(access_token):
    try:
        if not access_token:
            return None
        access_token = access_token.split(" ")[1]
        payload = jwt.decode(access_token , settings.JWT_SECRET , algorithms="HS256")
        return payload["sub"]
    except :
        return None    