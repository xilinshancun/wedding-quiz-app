"""
管理后台 API 路由

提供管理员登录、用户管理、奖励操作等接口
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import crud, schemas, models
from ..database import get_db
from ..auth import verify_admin, create_access_token, get_current_admin

router = APIRouter(prefix="/api/admin", tags=["管理后台"])


@router.post("/login", response_model=schemas.AdminToken)
def admin_login(login: schemas.AdminLogin):
    """管理员登录"""
    if not verify_admin(login.username, login.password):
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    
    token = create_access_token(data={"sub": login.username})
    return schemas.AdminToken(access_token=token)


@router.get("/dashboard", response_model=schemas.DashboardStats)
def get_dashboard(
    admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """获取仪表盘统计数据"""
    return crud.get_dashboard_stats(db)


@router.get("/banks", response_model=list[schemas.QuestionBankStatus])
def get_banks(
    admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """获取所有题库状态"""
    return crud.get_all_bank_stats(db)


@router.get("/users", response_model=list[schemas.UserResponse])
def get_users(
    q: str = None,
    skip: int = 0,
    limit: int = 100,
    admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    获取用户列表
    
    支持按昵称或识别码搜索
    """
    if q:
        return crud.search_users(db, q, limit)
    return crud.get_all_users(db, skip, limit)


@router.get("/users/{user_id}", response_model=schemas.UserResponse)
def get_user(
    user_id: int,
    admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """获取用户详情"""
    user = crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return user


@router.get("/users/{user_id}/rewards", response_model=list[schemas.RewardLogResponse])
def get_user_rewards(
    user_id: int,
    admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """获取用户奖励记录"""
    return crud.get_user_reward_logs(db, user_id)


@router.post("/reward/distribute", response_model=schemas.UserResponse)
def distribute_reward(
    data: schemas.RewardAdjust,
    admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    发放奖励
    
    扣减用户可领奖励数量，增加已领取数量
    """
    try:
        user = crud.adjust_reward(
            db, data.user_id, data.amount,
            models.RewardLogType.ADMIN_DISTRIBUTE,
            admin, data.note or "线下发奖"
        )
        return user
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/reward/add", response_model=schemas.UserResponse)
def add_reward(
    data: schemas.RewardAdjust,
    admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """增加奖励"""
    try:
        user = crud.adjust_reward(
            db, data.user_id, data.amount,
            models.RewardLogType.ADMIN_ADD,
            admin, data.note or "管理员手动增加"
        )
        return user
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/reward/deduct", response_model=schemas.UserResponse)
def deduct_reward(
    data: schemas.RewardAdjust,
    admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """扣减奖励"""
    try:
        user = crud.adjust_reward(
            db, data.user_id, data.amount,
            models.RewardLogType.ADMIN_DEDUCT,
            admin, data.note or "管理员手动扣减"
        )
        return user
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/logs", response_model=list[schemas.RewardLogResponse])
def get_all_logs(
    skip: int = 0,
    limit: int = 100,
    admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """获取所有奖励操作日志"""
    return crud.get_all_reward_logs(db, skip, limit)
