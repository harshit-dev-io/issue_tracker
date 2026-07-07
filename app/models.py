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

issue_label_bridge = Table(
    "issue_label",
    Base_Model.metadata,
    Column("issue" , UUID , ForeignKey("issue.id") , primary_key=True),
    Column("issue" , UUID , ForeignKey("label.id"))
)

class Label(Base_Model):
    __tablename__ = "label"
    id = Column(UUID , nullable=False , default=uuid.uuid4)
    name = Column(String , nullable=False)
    workspace = Column(UUID , ForeignKey("workspace.id" , ondelete="CASCADE") , nullable=True)
    type = Column(String , nullable=False)
    created_at = Column(DateTime , server_default=func.now())

class STATUS(enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in-progress"
    COMPLETED = "completed"

class Issue(Base_Model):
    __tablename__ = "issue"
    id = Column(UUID , nullable=False , default=uuid.uuid4)
    name = Column(String , nullable=False)
    owner = Column(UUID , ForeignKey("user.id" , ondelete="CASCADE") , nullable=False)
    board = Column(UUID , ForeignKey("board.id" , ondelete="CASCADE") , nullable=False)
    label = relationship("label" , secondary=issue_label_bridge , backref="issue")
    content = Column(String , nullable=True)
    status = Column(Enum(STATUS) , nullable=False ,default=STATUS.PENDING)
    created_at = Column(DateTime , server_default=func.now())

class Sub_Issue(Base_Model):
    __tablename__ = "sub-issue"
    id = Column(UUID , nullable=False , default=uuid.uuid4)
    name = Column(String , nullable=False)
    owner = Column(UUID , ForeignKey("user.id" , ondelete="CASCADE") , nullable=False)
    issue = Column(UUID , ForeignKey("issue.id" , ondelete="CASCADE") , nullable=False)
    content = Column(String , nullable=True)
    is_completed = Column(Boolean , nullable=False , default=False)
    created_at = Column(DateTime , server_default=func.now())