"""
来宾端 API 路由

提供来宾答题相关接口
"""
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from .. import crud, schemas, models
from ..database import get_db

router = APIRouter(prefix="/api/guest", tags=["来宾接口"])


def get_device_id(x_device_id: str = Header(..., alias="X-Device-ID")) -> str:
    """从请求头获取设备 ID"""
    if not x_device_id:
        raise HTTPException(status_code=400, detail="缺少设备标识")
    return x_device_id


@router.post("/init", response_model=schemas.UserResponse)
def init_user(device_id: str = Depends(get_device_id), db: Session = Depends(get_db)):
    """
    初始化用户
    
    首次访问时自动创建用户，后续访问返回已有用户
    """
    user = crud.get_or_create_user(db, device_id)
    return user


@router.get("/me", response_model=schemas.UserResponse)
def get_current_user(device_id: str = Depends(get_device_id), db: Session = Depends(get_db)):
    """获取当前用户信息"""
    user = crud.get_or_create_user(db, device_id)
    return user


@router.get("/banks", response_model=list[schemas.QuestionBankStatus])
def get_banks(db: Session = Depends(get_db)):
    """获取所有题库状态"""
    return crud.get_all_bank_stats(db)


@router.post("/session/{bank_id}", response_model=schemas.SessionResponse)
def start_session(
    bank_id: int, 
    device_id: str = Depends(get_device_id), 
    db: Session = Depends(get_db)
):
    """
    开始答题会话
    
    如果有未完成的会话则恢复，否则创建新会话
    """
    user = crud.get_or_create_user(db, device_id)
    bank = crud.get_question_bank(db, bank_id)
    if not bank:
        raise HTTPException(status_code=404, detail="题库不存在")
    
    session = crud.get_or_create_session(db, user.id, bank_id)
    return schemas.SessionResponse(
        id=session.id,
        bank_id=session.bank_id,
        bank_name=bank.name,
        questions_answered=session.questions_answered,
        questions_correct=session.questions_correct,
        is_completed=session.is_completed,
        created_at=session.created_at
    )


@router.get("/session/{session_id}/next", response_model=schemas.NextQuestionResponse)
def get_next_question(
    session_id: int,
    device_id: str = Depends(get_device_id),
    db: Session = Depends(get_db)
):
    """
    获取下一道题目
    
    返回：
    - 题目信息（如果有可用题目）
    - 会话是否完成
    - 题库是否已抢光
    """
    user = crud.get_or_create_user(db, device_id)
    session = db.query(models.QuizSession).filter(
        models.QuizSession.id == session_id,
        models.QuizSession.user_id == user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="会话不存在")
    
    if session.is_completed:
        return schemas.NextQuestionResponse(
            question=None,
            session_completed=True,
            bank_exhausted=False,
            message="本轮答题已完成，请重新扫码继续参与！"
        )
    
    question = crud.get_next_question(db, session)
    
    if not question:
        # 没有可用题目，标记会话完成
        session.is_completed = True
        db.commit()
        return schemas.NextQuestionResponse(
            question=None,
            session_completed=True,
            bank_exhausted=True,
            message="当前题库题目已被其他来宾抢光，请稍后再试或扫描其他题库二维码！"
        )
    
    return schemas.NextQuestionResponse(
        question=schemas.QuestionResponse(
            id=question.id,
            question_type=question.question_type,
            content=question.content,
            options=question.options
        ),
        session_completed=False,
        bank_exhausted=False,
        message=f"第 {session.questions_answered + 1}/3 题"
    )


@router.post("/answer", response_model=schemas.AnswerResult)
def submit_answer(
    answer: schemas.AnswerSubmit,
    device_id: str = Depends(get_device_id),
    db: Session = Depends(get_db)
):
    """提交答案"""
    user = crud.get_or_create_user(db, device_id)
    session = db.query(models.QuizSession).filter(
        models.QuizSession.id == answer.session_id,
        models.QuizSession.user_id == user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="会话不存在")
    
    if session.is_completed:
        raise HTTPException(status_code=400, detail="会话已结束")
    
    try:
        result = crud.submit_answer(db, session, answer.question_id, answer.answer)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/rewards", response_model=list[schemas.RewardLogResponse])
def get_my_rewards(
    device_id: str = Depends(get_device_id),
    db: Session = Depends(get_db)
):
    """获取我的奖励记录"""
    user = crud.get_or_create_user(db, device_id)
    logs = crud.get_user_reward_logs(db, user.id)
    return logs
