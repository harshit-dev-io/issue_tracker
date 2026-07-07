from fastapi import FastAPI , Depends 
from app.router import router
from app.config.database import engine , Base_Model
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = ["*"]

app.add_middleware(
    CORSMiddleware , 
    allow_origins = origins,
    allow_credentials = True,
    allow_headers = ["*"],
    allow_methods = ["*"]
)

app.include_router(router=router)

@app.on_event("startup")
async def startup():
    async with engine.begin() as db:
        await db.run_sync(Base_Model.metadata.create_all)
    