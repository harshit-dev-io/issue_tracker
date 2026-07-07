from pydantic import BaseModel , EmailStr 
from uuid import UUID
from typing import List
from app import models
from datetime import datetime

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

class Issue_create(BaseModel):
    name : str
    board_id : UUID
    label : List[UUID]
    assignees : List[UUID] = []
    content : str
    
class Label(BaseModel):
    id : UUID
    name : str
    type : models.LABEL_TYPE

class Label_create(BaseModel):
    name : str
    workspace_id : UUID

class Sub_Issue_create(BaseModel):
    name : str
    issue_id : UUID
    content : str

class Sub_Issue(BaseModel):
    id : UUID
    name : str
    content : str
    is_completed : bool

class Assignees(BaseModel):
    id : UUID
    name : str
    
class Issue(BaseModel):
    id : UUID
    name : str
    label : List[Label] = []
    sub_issues : List[Sub_Issue] = []
    assignees : List[Assignees] = []
    content : str
    status : models.STATUS
    created_at : datetime