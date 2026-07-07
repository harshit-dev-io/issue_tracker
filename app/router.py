from fastapi import APIRouter , Depends , status , HTTPException , Request
from app import schema
from app.config.database import get_db_connection , AsyncSession
from app import models
from sqlalchemy import select
from app.services import auth_services
from typing import List

router = APIRouter()

@router.post("/auth/signup/" , status_code=status.HTTP_201_CREATED)
async def Signup(data : schema.Signup , db:AsyncSession = Depends(get_db_connection)):
    try :
        user = models.User(
            name = data.name,
            email = data.email,
            password = data.password
        )
        db.add(user)
        await db.commit()
        
        return {"message":"user created"}
    
    except Exception as e :
        print(e)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST , detail=f"error : {e}")
    
    
@router.post("/auth/login/" , response_model=schema.Token_Response , status_code=status.HTTP_202_ACCEPTED)
async def Login(data : schema.Login , db:AsyncSession = Depends(get_db_connection)):
    try :
        query = select(models.User).where(models.User.email == data.email)
        response = await db.execute(query)
        user = response.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND , detail="user doesn't exists")
        if not user.verify_pw(data.password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED , detail="invalid creds")
        
        response , refresh = auth_services.Get_token(user.id)

        db.add(refresh)
        await db.commit()
        
        return response
    
    except Exception as e :
        print(e)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST , detail=f"error : {e}")

@router.post("/auth/refresh/" , response_model=schema.Token_Response , status_code=status.HTTP_201_CREATED)
async def Refresh(data : schema.Token_Refresh , db : AsyncSession = Depends(get_db_connection)):
    try:
        query = select(models.Refresh_Token).where(models.Refresh_Token.refresh_token == data.refresh_token , models.Refresh_Token.is_valid == True)
        result = await db.execute(query)
        old_refresh = result.scalar_one_or_none()
        if not old_refresh or not  old_refresh.verify_refresh_token():
            raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="not a valid token"
        )
        response , new_refresh = auth_services.Get_token(old_refresh.user_id)
        old_refresh.is_valid = False
        db.add(old_refresh)
        db.add(new_refresh)
        await db.commit()
        return response
    except Exception as e :
        print(e)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST , detail=f"error : {e}")

    
@router.post("/workspace/create/" , status_code=status.HTTP_201_CREATED)
async def Workspace_create(data : schema.workspace_create  , request : Request , db : AsyncSession = Depends(get_db_connection)):
    try:
        user_id = auth_services.Verify_access_token(request.headers.get("authorization"))
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED , detail="Invalid token")
        
        workspace = models.Workspace(
            name = data.name
        )
        db.add(workspace)
        await db.flush()
        membership = models.Membership(
            user = user_id,
            workspace = workspace.id,
            role = models.ROLE.OWNER
        )
        db.add(membership)
        await db.commit()
        return {"message":"created"}
    except Exception as e :
        print(e)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST , detail=f"error : {e}")
    
@router.get("/workspace/list/" , response_model=List[schema.workspace] , status_code=status.HTTP_200_OK)
async def Workspace_List(request : Request ,  db : AsyncSession = Depends(get_db_connection)):
    try: 
        user_id = auth_services.Verify_access_token(request.headers.get("authorization"))
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED , detail="Invalid token")
        query = select(models.Workspace).join(models.Membership).where(models.Membership.user == user_id)
        response = await db.execute(query)
        workspaces = response.scalars().all()

        return workspaces

    except Exception as e :
        print(e)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST , detail=f"error : {e}")
    
    