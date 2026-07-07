from pydantic import BaseModel , EmailStr 
from uuid import UUID
from typing import List , Optional
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

class Membership_create(BaseModel):
    email : EmailStr
    workspace_id : UUID
    role : models.ROLE

class Membership(BaseModel):
    user : UUID
    name : str
    role : models.ROLE

class Board_create(BaseModel):
    name : str
    workspace_id : UUID

class Board(BaseModel):
    id : UUID
    name : str

class Issue_create(BaseModel):
    name: str
    board_id: UUID
    label: List[UUID] = []
    assignees: List[UUID] = []
    content: Optional[str] = None
    priority: Optional[models.PRIORITY] = models.PRIORITY.LOW
    
class Label(BaseModel):
    id : UUID
    name : str

class Label_create(BaseModel):
    name : str
    workspace_id : UUID

class Sub_Issue_create(BaseModel):
    name : str
    issue_id : UUID
    content : Optional[str] = None

class Sub_Issue(BaseModel):
    id: UUID
    name: str
    content: Optional[str] = None 
    is_completed: bool

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
    priority : models.PRIORITY
    
class Issue(BaseModel):
    id: UUID
    name: str
    label: List[Label] = []
    sub_issues: List[Sub_Issue] = []
    assignees: List[Assignees] = []
    comments: List[CommentOut] = []
    content: Optional[str] = None 
    status: models.STATUS
    priority: models.PRIORITY
    created_at: datetime