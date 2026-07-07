from app.config.database import Base_Model
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Column , String , DateTime , func , ForeignKey , Enum , Table , Boolean
import uuid
from sqlalchemy.orm import validates , relationship
import bcrypt
import enum
from datetime import datetime , timezone , timedelta

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
    
class Refresh_Token(Base_Model):
    __tablename__ = "refreshtoken"

    id = Column(UUID(as_uuid=True) , primary_key=True , nullable=False , default=uuid.uuid4)
    refresh_token = Column(String , nullable=False)
    user_id = Column(UUID(as_uuid=True) , ForeignKey("user.id" , ondelete="CASCADE" ) , nullable=False)
    created_at = Column(DateTime(timezone=True) , server_default=func.now())
    expire_on = Column(DateTime(timezone=True) ,default=lambda: (datetime.now(timezone.utc) + timedelta(days=15)))
    is_valid  = Column(Boolean , default=True)

    def verify_refresh_token(self) -> bool :
        expire_on : datetime = self.expire_on 
        if expire_on.tzinfo is None : 
            expire_on = expire_on.replace(tzinfo=timezone.utc)

        return expire_on > datetime.now(timezone.utc) and self.is_valid
    

    
class Workspace(Base_Model):
    __tablename__ = "workspace"
    id = Column(UUID , nullable=False , default=uuid.uuid4 , primary_key=True)
    name = Column(String , nullable=False)
    created_at = Column(DateTime , server_default=func.now())

class ROLE(enum.Enum):
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"
    VIEWER = "viewer"

class Membership(Base_Model):
    __tablename__ = "membership"
    id = Column(UUID , nullable=False , default=uuid.uuid4 , primary_key=True)
    user = Column(UUID , ForeignKey("user.id" , ondelete="CASCADE") , nullable=False)
    workspace = Column(UUID , ForeignKey("workspace.id" , ondelete="CASCADE") , nullable=False)
    role = Column(Enum(ROLE) , nullable=False )
    created_at = Column(DateTime , server_default=func.now())

class Board(Base_Model):
    __tablename__ = "board"
    id = Column(UUID , nullable=False , default=uuid.uuid4 , primary_key=True)
    name = Column(String , nullable=False)
    owner = Column(UUID , ForeignKey("user.id" , ondelete="CASCADE") , nullable=False)
    workspace = Column(UUID , ForeignKey("workspace.id" , ondelete="CASCADE") , nullable=False)
    created_at = Column(DateTime , server_default=func.now())

issue_label_bridge = Table(
    "issue_label",
    Base_Model.metadata,
    Column("issue" , UUID , ForeignKey("issue.id") , primary_key=True),
    Column("label" , UUID , ForeignKey("label.id"), primary_key=True)
)

class Label(Base_Model):
    __tablename__ = "label"
    id = Column(UUID , nullable=False , default=uuid.uuid4 , primary_key=True)
    name = Column(String , nullable=False)
    workspace = Column(UUID , ForeignKey("workspace.id" , ondelete="CASCADE") , nullable=True)
    created_at = Column(DateTime , server_default=func.now())

class STATUS(enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in-progress"
    COMPLETED = "completed"

class PRIORITY(enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

issue_assignee_bridge = Table(
    "issue_assignee",
    Base_Model.metadata,
    Column("user" , UUID , ForeignKey("user.id") , primary_key=True),
    Column("issue" , UUID , ForeignKey("issue.id") , primary_key=True)
)

class Issue(Base_Model):
    __tablename__ = "issue"
    id = Column(UUID , nullable=False , default=uuid.uuid4 , primary_key=True)
    name = Column(String , nullable=False)
    owner = Column(UUID , ForeignKey("user.id" , ondelete="CASCADE") , nullable=False)
    board = Column(UUID , ForeignKey("board.id" , ondelete="CASCADE") , nullable=False)
    label = relationship("Label" , secondary=issue_label_bridge , backref="issue")
    sub_issues = relationship("Sub_Issue", back_populates="parent_issue", cascade="all, delete-orphan")
    assignees = relationship("User" , secondary=issue_assignee_bridge , backref="issue")
    priority = Column(Enum(PRIORITY) , nullable=False , default=PRIORITY.LOW)
    comments = relationship("Comment", cascade="all, delete-orphan")
    content = Column(String , nullable=True)
    status = Column(Enum(STATUS) , nullable=False ,default=STATUS.PENDING)
    created_at = Column(DateTime , server_default=func.now())

class Sub_Issue(Base_Model):
    __tablename__ = "sub-issue"
    id = Column(UUID , nullable=False , default=uuid.uuid4 , primary_key=True)
    name = Column(String , nullable=False)
    owner = Column(UUID , ForeignKey("user.id" , ondelete="CASCADE") , nullable=False)
    issue = Column(UUID , ForeignKey("issue.id" , ondelete="CASCADE") , nullable=False)
    parent_issue = relationship("Issue", back_populates="sub_issues" )
    content = Column(String , nullable=True)
    is_completed = Column(Boolean , nullable=False , default=False)
    created_at = Column(DateTime , server_default=func.now())

class Comment(Base_Model):
    __tablename__ = "comment"
    id = Column(UUID, nullable=False, default=uuid.uuid4, primary_key=True)
    content = Column(String, nullable=False)
    user_id = Column(UUID, ForeignKey("user.id", ondelete="CASCADE"), nullable=False)
    issue_id = Column(UUID, ForeignKey("issue.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    author = relationship("User")