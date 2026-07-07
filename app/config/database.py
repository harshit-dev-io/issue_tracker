from sqlalchemy.ext.asyncio import create_async_engine , AsyncSession , async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.config.settings import settings

engine = create_async_engine(
    settings.DATABASE_URL
)

Async_Session_Maker = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

Base_Model = declarative_base()

async def get_db_connection():
    async with Async_Session_Maker() as session : 
        yield session