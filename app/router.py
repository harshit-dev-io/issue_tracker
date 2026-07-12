from fastapi import APIRouter , Depends , status , HTTPException , Request
from app import schema
from app.config.database import get_db_connection , AsyncSession
from app import models
from sqlalchemy import select
from app.services import auth_services , workspace_services
from typing import List
from sqlalchemy.orm import selectinload
from fastapi_pagination import add_pagination , Page , Params
from fastapi_pagination.ext.sqlalchemy import paginate

router = APIRouter()

@router.post("/auth/signup/" , status_code=status.HTTP_201_CREATED)
async def Signup(data : schema.Signup , db:AsyncSession = Depends(get_db_connection)):
    try :
        query = select(models.User).where(models.User.email == data.email)
        response = await db.execute(query)
        user = response.scalar_one_or_none()
        if user:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN , detail="user exists")
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
    
    except HTTPException as http_ex:
        raise http_ex
    
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
    
    except HTTPException as http_ex:
        raise http_ex
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
    
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e :
        print(e)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST , detail=f"error : {e}")
    
@router.get("/workspace/list/" , response_model=Page[schema.workspace] , status_code=status.HTTP_200_OK)
async def Workspace_List(request : Request ,params : Params = Depends() ,  db : AsyncSession = Depends(get_db_connection)):
    try: 
        user_id = auth_services.Verify_access_token(request.headers.get("authorization"))
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED , detail="Invalid token")
        query = select(models.Workspace).join(models.Membership).where(models.Membership.user == user_id)
        return await paginate(db , query , params)
    
    except HTTPException as http_ex:
        raise http_ex
    
    except Exception as e :
        print(e)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST , detail=f"error : {e}")
    
@router.post("/membership/create/" , status_code=status.HTTP_201_CREATED)
async def Membership_create(data : schema.Membership_create  , request : Request , db : AsyncSession = Depends(get_db_connection)):
    try:
        user_id = auth_services.Verify_access_token(request.headers.get("authorization"))
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED , detail="Invalid token")
        
        await workspace_services.check_has_role(
            user_id=user_id, 
            workspace_id=data.workspace_id, 
            allowed_roles=[models.ROLE.OWNER, models.ROLE.ADMIN], 
            db=db
        )
        
        if data.role == models.ROLE.OWNER:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN , detail="you dont have permission to perform this action")
        
        response = await db.execute(select(models.User).where(models.User.email == data.email))
        user = response.scalar_one_or_none()

        if not user :
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND , detail="user doesn't exists")
        
        membership = models.Membership(
            user = user.id,
            workspace = data.workspace_id,
            role = data.role
        )
        db.add(membership)
        await db.commit()
        return {"message":"created"}
    
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e :
        print(e)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST , detail=f"error : {e}")
    
@router.get("/membership/list/" , response_model=Page[schema.Membership] , status_code=status.HTTP_200_OK)
async def Membership_List(workspace_id , request : Request , params : Params = Depends() , db : AsyncSession = Depends(get_db_connection)):
    try: 
        user_id = auth_services.Verify_access_token(request.headers.get("authorization"))
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED , detail="Invalid token")
        await workspace_services.check_has_role(
            user_id=user_id, 
            workspace_id=workspace_id, 
            allowed_roles=[models.ROLE.OWNER, models.ROLE.ADMIN , models.ROLE.MEMBER , models.ROLE.VIEWER], 
            db=db
        )
        query = select(models.Membership.user.label("user") , models.User.name.label("name") , models.Membership.role.label("role")).select_from(models.Membership).join(models.User , models.User.id == models.Membership.user).where(models.Membership.workspace == workspace_id)
        return await paginate(db , query , params)

    except HTTPException as http_ex:
        raise http_ex
    except Exception as e :
        print(e)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST , detail=f"error : {e}")

    
@router.post("/board/create/" , status_code=status.HTTP_201_CREATED)
async def Board_Create(data : schema.Board_create , request : Request, db : AsyncSession = Depends(get_db_connection)):
    try: 
        user_id = auth_services.Verify_access_token(request.headers.get("authorization"))
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED , detail="Invalid token")
        await workspace_services.check_has_role(
            user_id=user_id, 
            workspace_id=data.workspace_id, 
            allowed_roles=[models.ROLE.OWNER, models.ROLE.ADMIN , models.ROLE.MEMBER], 
            db=db
        )
        board = models.Board(
            name = data.name,
            owner = user_id,
            workspace = data.workspace_id
        )
        db.add(board)
        await db.commit()
        return {"message" : "created"}
    
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e :
        print(e)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST , detail=f"error : {e}")
    
@router.get("/board/list/" , response_model=Page[schema.Board] ,  status_code=status.HTTP_200_OK)
async def Board_List( workspace_id ,request : Request, params : Params = Depends() ,db : AsyncSession = Depends(get_db_connection)):
    try: 
        user_id = auth_services.Verify_access_token(request.headers.get("authorization"))
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED , detail="Invalid token")
        await workspace_services.check_has_role(
            user_id=user_id, 
            workspace_id=workspace_id, 
            allowed_roles=[models.ROLE.OWNER, models.ROLE.ADMIN , models.ROLE.MEMBER , models.ROLE.VIEWER], 
            db=db
        )
        query = select(models.Board).join(models.Workspace).join(models.Membership).where( models.Membership.workspace == workspace_id , models.Membership.user == user_id)
        return await paginate(db , query , params)
    
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e :
        print(e)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST , detail=f"error : {e}")

@router.post("/issue/create/" , status_code=status.HTTP_201_CREATED)
async def Issue_Create(data : schema.Issue_create , workspace_id , request : Request, db : AsyncSession = Depends(get_db_connection)):
    try: 
        user_id = auth_services.Verify_access_token(request.headers.get("authorization"))
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED , detail="Invalid token")
        await workspace_services.check_has_role(
            user_id=user_id, 
            workspace_id=workspace_id, 
            allowed_roles=[models.ROLE.OWNER, models.ROLE.ADMIN , models.ROLE.MEMBER], 
            db=db
        )
        query = select(models.Label).where(models.Label.id.in_(data.label))
        response = await db.execute(query)
        labels = response.scalars().all()
        query = select(models.User).join(models.Membership).where(models.Membership.user.in_(data.assignees))
        response = await db.execute(query)
        assignees = response.scalars().all()
        issue = models.Issue(
            name=data.name,
            owner=user_id,
            board=data.board_id,
            label=labels,
            assignees=assignees, 
            content=data.content,
            priority=data.priority 
        )
        db.add(issue)
        await db.commit()
        return {"message" : "created"}
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e :
        print(e)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST , detail=f"error : {e}")
    
@router.put("/issue/update/", response_model=schema.Issue, status_code=status.HTTP_200_OK)
async def Issue_update(data: schema.Issue_update, workspace_id: str, request: Request, db: AsyncSession = Depends(get_db_connection)):
    try: 
        user_id = auth_services.Verify_access_token(request.headers.get("authorization"))
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
            
        await workspace_services.check_has_role(
            user_id=user_id, 
            workspace_id=workspace_id, 
            allowed_roles=[models.ROLE.OWNER, models.ROLE.ADMIN, models.ROLE.MEMBER, models.ROLE.VIEWER], 
            db=db
        )

        query = select(models.Issue).where(models.Issue.id == data.id).options(
            selectinload(models.Issue.label),
            selectinload(models.Issue.assignees),
            selectinload(models.Issue.sub_issues),  # ADD THIS LINE
            selectinload(models.Issue.comments)
        )
        response = await db.execute(query)
        issue = response.scalar_one_or_none()
        
        if not issue:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")

        update_data = data.model_dump(exclude_unset=True)
        new_labels = update_data.pop("label", None)
        new_assignees = update_data.pop("assignees", None)
        update_data.pop("sub_issues", None) 

        for key, value in update_data.items():
            setattr(issue, key, value)

        if new_labels is not None:
            label_ids = [lbl['id'] if isinstance(lbl, dict) else lbl for lbl in new_labels]
            label_query = select(models.Label).where(models.Label.id.in_(label_ids))
            label_res = await db.execute(label_query)
            issue.label = label_res.scalars().all()

        if new_assignees is not None:
            assignee_ids = [user['id'] if isinstance(user, dict) else user for user in new_assignees]
            user_query = select(models.User).where(models.User.id.in_(assignee_ids))
            user_res = await db.execute(user_query)
            issue.assignees = user_res.scalars().all()

        await db.commit()
        await db.refresh(issue)
        
        return issue

    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        print(e)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"error : {e}")
    
@router.get("/issue/list/" , response_model=Page[schema.Issue] ,  status_code=status.HTTP_200_OK)
async def Issue_List( board_id, workspace_id ,request : Request , params : Params = Depends() , db : AsyncSession = Depends(get_db_connection)):
    try: 
        user_id = auth_services.Verify_access_token(request.headers.get("authorization"))
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED , detail="Invalid token")
        await workspace_services.check_has_role(
            user_id=user_id, 
            workspace_id=workspace_id, 
            allowed_roles=[models.ROLE.OWNER, models.ROLE.ADMIN , models.ROLE.MEMBER , models.ROLE.VIEWER], 
            db=db
        )
        query = select(models.Issue).join(models.Board).join(models.Workspace).join(models.Membership).where( models.Membership.workspace == workspace_id , models.Membership.user == user_id , models.Board.id == board_id).options(selectinload(models.Issue.label), selectinload(models.Issue.sub_issues) , selectinload(models.Issue.comments))
        return await paginate(db , query , params)
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e :
        print(e)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST , detail=f"error : {e}")
    
@router.delete("/issue/delete/", status_code=status.HTTP_200_OK)
async def Issue_Delete(issue_id , workspace_id , request: Request, db: AsyncSession = Depends(get_db_connection)):
    try:
        user_id = auth_services.Verify_access_token(request.headers.get("authorization"))
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        await workspace_services.check_has_role(
            user_id=user_id, 
            workspace_id=workspace_id, 
            allowed_roles=[models.ROLE.OWNER, models.ROLE.ADMIN , models.ROLE.MEMBER], 
            db=db
        )
        query = select(models.Issue).where(models.Issue.id == issue_id)
        response = await db.execute(query)
        issue = response.scalar_one_or_none()
        if not issue:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")
        
        await db.delete(issue)
        await db.commit()
        return {"message": "Issue deleted successfully"}
        
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        print(e)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"error : {e}")

@router.get("/issue/search/" , response_model=Page[schema.Issue] ,  status_code=status.HTTP_200_OK)
async def Get_Issue( board_id, workspace_id , search_param ,request : Request , params : Params = Depends() , db : AsyncSession = Depends(get_db_connection)):
    try: 
        user_id = auth_services.Verify_access_token(request.headers.get("authorization"))
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED , detail="Invalid token")
        await workspace_services.check_has_role(
            user_id=user_id, 
            workspace_id=workspace_id, 
            allowed_roles=[models.ROLE.OWNER, models.ROLE.ADMIN , models.ROLE.MEMBER , models.ROLE.VIEWER], 
            db=db
        )
        query = select(models.Issue).join(models.Board).join(models.Workspace).join(models.Membership).where( models.Membership.workspace == workspace_id , models.Membership.user == user_id , models.Board.id == board_id , models.Issue.name.ilike(f"%{search_param}%")).options(selectinload(models.Issue.label), selectinload(models.Issue.sub_issues), selectinload(models.Issue.comments))
        return await paginate(db , query , params)
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e :
        print(e)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST , detail=f"error : {e}")
@router.post("/label/create/" , status_code=status.HTTP_201_CREATED)
async def label_Create(data : schema.Label_create , request : Request, db : AsyncSession = Depends(get_db_connection)):
    try: 
        user_id = auth_services.Verify_access_token(request.headers.get("authorization"))
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED , detail="Invalid token")
        await workspace_services.check_has_role(
            user_id=user_id, 
            workspace_id=data.workspace_id, 
            allowed_roles=[models.ROLE.OWNER, models.ROLE.ADMIN , models.ROLE.MEMBER , models.ROLE.VIEWER], 
            db=db
        )

        label = models.Label(
            name = data.name,
            workspace = data.workspace_id,
        )
        db.add(label)
        await db.commit()
        return {"message" : "created"}
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e :
        print(e)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST , detail=f"error : {e}")
    
@router.get("/label/list/" , response_model=Page[schema.Label] ,  status_code=status.HTTP_200_OK)
async def label_List(workspace_id , request : Request , params : Params = Depends(), db : AsyncSession = Depends(get_db_connection)):
    try: 
        user_id = auth_services.Verify_access_token(request.headers.get("authorization"))
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED , detail="Invalid token")
        query = select(models.Label).join(models.Workspace).join(models.Membership).where(models.Membership.workspace == workspace_id , models.Membership.user == user_id )
        return await paginate(db , query , params)
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e :
        print(e)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST , detail=f"error : {e}")
    
@router.post("/sub_issue/create/" , status_code=status.HTTP_201_CREATED)
async def Sub_Issue_Create(data : schema.Sub_Issue_create , workspace_id , request : Request, db : AsyncSession = Depends(get_db_connection)):
    try: 
        user_id = auth_services.Verify_access_token(request.headers.get("authorization"))
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED , detail="Invalid token")
        await workspace_services.check_has_role(
            user_id=user_id, 
            workspace_id=workspace_id, 
            allowed_roles=[models.ROLE.OWNER, models.ROLE.ADMIN , models.ROLE.MEMBER], 
            db=db
        )
        sub_issue = models.Sub_Issue(
            name = data.name,
            owner = user_id,
            issue = data.issue_id,
            content = data.content 
        )
        db.add(sub_issue)
        await db.commit()
        return {"message" : "created"}
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e :
        print(e)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST , detail=f"error : {e}")

@router.post("/comment/create/", status_code=status.HTTP_201_CREATED)
async def Comment_Create(data: schema.CommentCreate,workspace_id, request: Request, db: AsyncSession = Depends(get_db_connection)):
    try:
        user_id = auth_services.Verify_access_token(request.headers.get("authorization"))
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        await workspace_services.check_has_role(
                user_id=user_id, 
                workspace_id=workspace_id, 
                allowed_roles=[models.ROLE.OWNER, models.ROLE.ADMIN , models.ROLE.MEMBER , models.ROLE.VIEWER], 
                db=db
            )
        comment = models.Comment(content=data.content, user_id=user_id, issue_id=data.issue_id)
        db.add(comment)
        await db.commit()
        return {"message": "Comment posted"}
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        print(e)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"error : {e}")

add_pagination(router)