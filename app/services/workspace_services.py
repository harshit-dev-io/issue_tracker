from app import models
from sqlalchemy import select
from fastapi import HTTPException

async def check_has_role(user_id: str, workspace_id: str, allowed_roles: list, db):
    query = select(models.Membership).where(
        models.Membership.user == user_id,
        models.Membership.workspace == workspace_id
    )
    res = await db.execute(query)
    membership = res.scalar_one_or_none()
    if not membership or membership.role not in allowed_roles:
        raise HTTPException(status_code=403, detail="Insufficient workspace permissions.")