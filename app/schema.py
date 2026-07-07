from pydantic import BaseModel , EmailStr

class Signup(BaseModel):
    name : str
    email : EmailStr
    password : str

class Login(BaseModel):
    email : EmailStr
    password : str

class Token_Response(BaseModel):
    access_token : str
    refresh_token : str 

class Token_Refresh(BaseModel):
    refresh_token : str 