from fastapi import APIRouter , Depends , status , HTTPException , Request
from app import schema
from app.config.database import get_db_connection , AsyncSession
from app import models
from sqlalchemy import select , or_
from app.services import auth_services
from typing import List
from sqlalchemy.orm import selectinload
from fastapi_pagination import paginate , add_pagination , Page 

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
    
@router.post("/board/create/" , status_code=status.HTTP_201_CREATED)
async def Board_Create(data : schema.Board_create , request : Request, db : AsyncSession = Depends(get_db_connection)):
    try: 
        user_id = auth_services.Verify_access_token(request.headers.get("authorization"))
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED , detail="Invalid token")
        board = models.Board(
            name = data.name,
            owner = user_id,
            workspace = data.workspace_id
        )
        db.add(board)
        await db.commit()
        return {"message" : "created"}
    except Exception as e :
        print(e)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST , detail=f"error : {e}")
    
@router.get("/board/list/" , response_model=List[schema.Board] ,  status_code=status.HTTP_200_OK)
async def Board_List( workspace_id ,request : Request, db : AsyncSession = Depends(get_db_connection)):
    try: 
        user_id = auth_services.Verify_access_token(request.headers.get("authorization"))
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED , detail="Invalid token")
        query = select(models.Board).join(models.Workspace).join(models.Membership).where( models.Membership.workspace == workspace_id , models.Membership.user == user_id)
        response = await db.execute(query)
        boards = response.scalars().all()
        return boards
    except Exception as e :
        print(e)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST , detail=f"error : {e}")

@router.post("/issue/create/" , status_code=status.HTTP_201_CREATED)
async def Issue_Create(data : schema.Issue_create , request : Request, db : AsyncSession = Depends(get_db_connection)):
    try: 
        user_id = auth_services.Verify_access_token(request.headers.get("authorization"))
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED , detail="Invalid token")
        query = select(models.Label).where(models.Label.id.in_(data.label))
        response = await db.execute(query)
        labels = response.scalars().all()
        query = select(models.User).join(models.Membership).where(models.Membership.id.in_(data.assignees))
        response = await db.execute(query)
        assignees = response.scalars().all()
        issue = models.Issue(
            name = data.name,
            owner = user_id,
            board = data.board_id,
            label = labels,
            assignees = assignees , 
            content = data.content
        )
        db.add(issue)
        await db.commit()
        return {"message" : "created"}
    except Exception as e :
        print(e)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST , detail=f"error : {e}")
    
@router.get("/issue/list/" , response_model=List[schema.Issue] ,  status_code=status.HTTP_200_OK)
async def Issue_List( board_id, workspace_id ,request : Request, db : AsyncSession = Depends(get_db_connection)):
    try: 
        user_id = auth_services.Verify_access_token(request.headers.get("authorization"))
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED , detail="Invalid token")
        query = select(models.Issue).join(models.Board).join(models.Workspace).join(models.Membership).where( models.Membership.workspace == workspace_id , models.Membership.user == user_id , models.Board.id == board_id).options(selectinload(models.Issue.label), selectinload(models.Issue.sub_issues))
        response = await db.execute(query)
        issues = response.scalars().all()
        return issues
    except Exception as e :
        print(e)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST , detail=f"error : {e}")

@router.post("/label/create/" , status_code=status.HTTP_201_CREATED)
async def label_Create(data : schema.Label_create , request : Request, db : AsyncSession = Depends(get_db_connection)):
    try: 
        user_id = auth_services.Verify_access_token(request.headers.get("authorization"))
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED , detail="Invalid token")
        label = models.Label(
            name = data.name,
            workspace = data.workspace_id,
            type = models.LABEL_TYPE.TAG
        )
        db.add(label)
        await db.commit()
        return {"message" : "created"}
    except Exception as e :
        print(e)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST , detail=f"error : {e}")
    
@router.get("/label/list/" , response_model=List[schema.Label] ,  status_code=status.HTTP_200_OK)
async def label_List(workspace_id , request : Request, db : AsyncSession = Depends(get_db_connection)):
    try: 
        user_id = auth_services.Verify_access_token(request.headers.get("authorization"))
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED , detail="Invalid token")
        query = select(models.Label).join(models.Workspace).join(models.Membership).where( or_(models.Membership.workspace == workspace_id , models.Membership.workspace == None ) , models.Membership.user == user_id )
        response = await db.execute(query)
        labels = response.scalars().all()
        return labels
    except Exception as e :
        print(e)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST , detail=f"error : {e}")
    
@router.post("/sub_issue/create/" , status_code=status.HTTP_201_CREATED)
async def Sub_Issue_Create(data : schema.Sub_Issue_create , request : Request, db : AsyncSession = Depends(get_db_connection)):
    try: 
        user_id = auth_services.Verify_access_token(request.headers.get("authorization"))
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED , detail="Invalid token")
        sub_issue = models.Sub_Issue(
            name = data.name,
            owner = user_id,
            issue = data.issue_id,
            content = data.content
        )
        db.add(sub_issue)
        await db.commit()
        return {"message" : "created"}
    except Exception as e :
        print(e)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST , detail=f"error : {e}")