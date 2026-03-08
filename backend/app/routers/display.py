"""
公共展示页 API 路由

提供现场投屏展示所需的接口
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import crud, schemas
from ..database import get_db

router = APIRouter(prefix="/api/display", tags=["公共展示"])


@router.get("/banks", response_model=list[schemas.QuestionBankStatus])
def get_banks_status(db: Session = Depends(get_db)):
    """
    获取所有题库状态
    
    用于公共展示页显示各题库的二维码和实时状态
    """
    return crud.get_all_bank_stats(db)
