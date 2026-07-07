from app.config.database import Base_Model
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Column , String , DateTime , func , ForeignKey , Enum , Table , Boolean
import uuid
from sqlalchemy.orm import validates , relationship
import bcrypt
import enum

class User(Base_Model):
    __tablename__ = "user"

    id = Column(UUID , nullable=False , primary_key=True ,  default=uuid.uuid4)
    name = Column(String , nullable=False)
    email = Column(String , nullable=False , unique=True)
    password = Column(String , nullable=False)
    created_at = Column(DateTime , server_default=func.now())

    @validates("password")
    def hash_password(self , key , value):
        salt = bcrypt.gensalt()
        hashed_pw = bcrypt.hashpw(value.encode("utf-8") , salt=salt)
        return hashed_pw.decode("utf-8")
    
    def verify_pw(self , unhashed_pw:str):
        return bcrypt.checkpw(unhashed_pw.encode("utf-8") , self.password.encode("utf-8"))
    
class Workspace(Base_Model):
    __tablename__ = "workspace"
    id = Column(UUID , nullable=False , default=uuid.uuid4)
    name = Column(String , nullable=False)
    created_at = Column(DateTime , server_default=func.now())

class Membership(Base_Model):
    __tablename__ = "membership"
    id = Column(UUID , nullable=False , default=uuid.uuid4)
    user = Column(UUID , ForeignKey("user.id" , ondelete="CASCADE") , nullable=False)
    workspace = Column(UUID , ForeignKey("workspace.id" , ondelete="CASCADE") , nullable=False)
    role = Column(String , nullable=False )
    created_at = Column(DateTime , server_default=func.now())

class Board(Base_Model):
    __tablename__ = "board"
    id = Column(UUID , nullable=False , default=uuid.uuid4)
    name = Column(String , nullable=False)
    owner = Column(UUID , ForeignKey("user.id" , ondelete="CASCADE") , nullable=False)
    workspace = Column(UUID , ForeignKey("workspace.id" , ondelete="CASCADE") , nullable=False)
    created_at = Column(DateTime , server_default=func.now())

