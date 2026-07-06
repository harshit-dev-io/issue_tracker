import os
from dotenv import load_dotenv

load_dotenv()

class Settings():
    DATABASE_URL = os.getenv("DATABASE_URL")
    JWT_SECRET = os.getenv("JWT_SECRET")

    if not (DATABASE_URL or JWT_SECRET) :
        raise Exception("not a valid database url or jwt secret")

settings = Settings()