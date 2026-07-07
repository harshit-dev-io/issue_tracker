from pydantic import BaseModel , EmailStr
from uuid import UUID

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

class workspace_create(BaseModel):
    name : str

class workspace(BaseModel):
    id : UUID
    name : str

class Board_create(BaseModel):
    name : str
    workspace_id : UUID

class Board(BaseModel):
    id : UUID
    name : str