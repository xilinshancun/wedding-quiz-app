"""
数据库操作模块

包含所有数据库 CRUD 操作
"""
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from . import models, schemas
from .utils import check_answer


def get_or_create_user(db: Session, device_id: str) -> models.User:
    """
    获取或创建用户
    
    根据设备 ID 查找用户，如果不存在则创建新用户
    """
    user = db.query(models.User).filter(models.User.device_id == device_id).first()
    if user:
        user.last_active_at = datetime.utcnow()
        db.commit()
        return user
    
    user = models.User(
        device_id=device_id,
        nickname=models.generate_nickname(),
        display_code=models.User.generate_display_code(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_user_by_id(db: Session, user_id: int) -> Optional[models.User]:
    """根据 ID 获取用户"""
    return db.query(models.User).filter(models.User.id == user_id).first()


def search_users(db: Session, query: str, limit: int = 20) -> list[models.User]:
    """
    搜索用户
    
    支持按昵称或展示码模糊搜索
    """
    return db.query(models.User).filter(
        (models.User.nickname.ilike(f"%{query}%")) |
        (models.User.display_code.ilike(f"%{query}%"))
    ).limit(limit).all()


def get_all_users(db: Session, skip: int = 0, limit: int = 100) -> list[models.User]:
    """获取所有用户，按最后活跃时间倒序"""
    return db.query(models.User).order_by(models.User.last_active_at.desc()).offset(skip).limit(limit).all()


def get_question_bank(db: Session, bank_id: int) -> Optional[models.QuestionBank]:
    """根据 ID 获取题库"""
    return db.query(models.QuestionBank).filter(models.QuestionBank.id == bank_id).first()


def get_all_banks(db: Session) -> list[models.QuestionBank]:
    """获取所有题库"""
    return db.query(models.QuestionBank).all()


def get_bank_stats(db: Session, bank_id: int) -> schemas.QuestionBankStatus:
    """
    获取题库状态
    
    包含：总题数、剩余题数、空闲题数、正在答题人数
    """
    bank = get_question_bank(db, bank_id)
    if not bank:
        raise ValueError(f"题库 {bank_id} 不存在")
    
    # 总题数
    total = db.query(func.count(models.Question.id)).filter(
        models.Question.bank_id == bank_id
    ).scalar()
    
    # 剩余题数（未被答对的题目）
    remaining = db.query(func.count(models.Question.id)).filter(
        models.Question.bank_id == bank_id,
        models.Question.is_answered == False
    ).scalar()
    
    # 正在答题人数（5 分钟内有未完成会话的用户）
    five_minutes_ago = datetime.utcnow() - timedelta(minutes=5)
    active_sessions = db.query(models.QuizSession).filter(
        models.QuizSession.bank_id == bank_id,
        models.QuizSession.is_completed == False,
        models.QuizSession.created_at >= five_minutes_ago
    ).all()
    
    active = len(active_sessions)
    
    # 计算被锁定的题目数（正在被人答的题目）
    # 每个活跃会话最多锁定 (3 - 已答题数) 道题
    locked_count = sum(max(0, 3 - s.questions_answered) for s in active_sessions)
    
    # 空闲题目 = 剩余题目 - 被锁定的题目（不能小于 0）
    available = max(0, remaining - locked_count)
    
    return schemas.QuestionBankStatus(
        id=bank.id,
        name=bank.name,
        total_questions=total,
        remaining_questions=remaining,
        available_questions=available,
        active_players=active
    )


def get_all_bank_stats(db: Session) -> list[schemas.QuestionBankStatus]:
    """获取所有题库状态"""
    banks = get_all_banks(db)
    return [get_bank_stats(db, bank.id) for bank in banks]


def get_or_create_session(db: Session, user_id: int, bank_id: int) -> models.QuizSession:
    """
    获取未完成的会话或创建新会话
    
    如果用户在该题库有未完成的会话，则恢复该会话
    否则创建新会话
    """
    session = db.query(models.QuizSession).filter(
        models.QuizSession.user_id == user_id,
        models.QuizSession.bank_id == bank_id,
        models.QuizSession.is_completed == False
    ).first()
    
    if session:
        return session
    
    session = models.QuizSession(user_id=user_id, bank_id=bank_id)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def get_next_question(db: Session, session: models.QuizSession) -> Optional[models.Question]:
    """
    获取下一道题目
    
    规则：
    - 会话已答满 3 题则返回 None
    - 排除本会话已答过的题目
    - 排除已被其他人答对的题目
    - 随机选择一道
    """
    if session.questions_answered >= 3:
        return None
    
    # 本会话已答过的题目 ID
    answered_question_ids = db.query(models.SessionAnswer.question_id).filter(
        models.SessionAnswer.session_id == session.id
    ).subquery()
    
    # 随机获取一道可用题目
    question = db.query(models.Question).filter(
        models.Question.bank_id == session.bank_id,
        models.Question.is_answered == False,
        ~models.Question.id.in_(answered_question_ids)
    ).order_by(func.random()).first()
    
    return question


def submit_answer(
    db: Session, 
    session: models.QuizSession, 
    question_id: int, 
    user_answer: str
) -> schemas.AnswerResult:
    """
    提交答案
    
    处理逻辑：
    1. 使用行锁获取题目，防止并发问题
    2. 检查答案是否正确
    3. 如果正确且题目未被答对，标记题目并发放奖励
    4. 如果正确但题目已被抢先答对，不发放奖励
    5. 记录答题记录
    6. 更新会话状态
    """
    # 使用 FOR UPDATE 锁定题目行，防止并发答题时重复发奖
    question = db.query(models.Question).filter(models.Question.id == question_id).with_for_update().first()
    
    if not question:
        raise ValueError("题目不存在")
    
    if question.bank_id != session.bank_id:
        raise ValueError("题目不属于当前题库")
    
    # 检查是否已经回答过
    existing = db.query(models.SessionAnswer).filter(
        models.SessionAnswer.session_id == session.id,
        models.SessionAnswer.question_id == question_id
    ).first()
    if existing:
        raise ValueError("该题目已经回答过")
    
    is_correct = check_answer(user_answer, question.correct_answer)
    got_reward = False
    message = ""
    
    if is_correct:
        if question.is_answered:
            # 答对了但被别人抢先
            message = "回答正确！但这道题已被其他来宾抢先答对，未获得奖励"
        else:
            # 答对且是第一个答对的人
            question.is_answered = True
            question.answered_by_id = session.user_id
            question.answered_at = datetime.utcnow()
            got_reward = True
            message = "恭喜答对！获得1个奖励！"
            
            # 更新用户奖励（使用行锁）
            user = db.query(models.User).filter(models.User.id == session.user_id).with_for_update().first()
            user.total_correct += 1
            user.reward_balance += 1
            
            # 记录奖励日志
            reward_log = models.RewardLog(
                user_id=user.id,
                log_type=models.RewardLogType.ANSWER_CORRECT,
                amount=1,
                balance_after=user.reward_balance,
                note=f"答对题目 #{question.id}"
            )
            db.add(reward_log)
    else:
        message = "回答错误，再接再厉！"
    
    # 记录答题记录
    answer_record = models.SessionAnswer(
        session_id=session.id,
        question_id=question_id,
        user_answer=user_answer,
        is_correct=is_correct,
        got_reward=got_reward
    )
    db.add(answer_record)
    
    # 更新会话状态
    session.questions_answered += 1
    if is_correct:
        session.questions_correct += 1
    
    # 答满 3 题则完成会话
    if session.questions_answered >= 3:
        session.is_completed = True
        session.completed_at = datetime.utcnow()
    
    db.commit()
    
    # 获取最新用户数据
    user = db.query(models.User).filter(models.User.id == session.user_id).first()
    
    return schemas.AnswerResult(
        is_correct=is_correct,
        got_reward=got_reward,
        message=message,
        user_total_correct=user.total_correct,
        user_reward_balance=user.reward_balance,
        session_questions_answered=session.questions_answered,
        session_is_completed=session.is_completed
    )


def adjust_reward(
    db: Session, 
    user_id: int, 
    amount: int, 
    log_type: models.RewardLogType,
    admin_operator: str,
    note: Optional[str] = None
) -> models.User:
    """
    调整用户奖励
    
    支持三种操作：
    - ADMIN_DISTRIBUTE: 发放奖励（扣减可领数量，增加已领取数量）
    - ADMIN_ADD: 增加奖励
    - ADMIN_DEDUCT: 扣减奖励
    """
    # 使用行锁防止并发操作
    user = db.query(models.User).filter(models.User.id == user_id).with_for_update().first()
    if not user:
        raise ValueError("用户不存在")
    
    if log_type == models.RewardLogType.ADMIN_DISTRIBUTE:
        # 发放奖励：检查余额是否足够
        if user.reward_balance < amount:
            raise ValueError(f"用户可领奖励不足，当前余额: {user.reward_balance}")
        user.reward_balance -= amount
        user.reward_claimed += amount
    elif log_type == models.RewardLogType.ADMIN_ADD:
        # 增加奖励
        user.reward_balance += amount
    elif log_type == models.RewardLogType.ADMIN_DEDUCT:
        # 扣减奖励
        user.reward_balance -= amount
    
    # 记录日志
    reward_log = models.RewardLog(
        user_id=user.id,
        log_type=log_type,
        amount=amount,
        balance_after=user.reward_balance,
        note=note,
        admin_operator=admin_operator
    )
    db.add(reward_log)
    db.commit()
    db.refresh(user)
    
    return user


def get_user_reward_logs(db: Session, user_id: int, limit: int = 50) -> list[models.RewardLog]:
    """获取用户奖励日志"""
    return db.query(models.RewardLog).filter(
        models.RewardLog.user_id == user_id
    ).order_by(models.RewardLog.created_at.desc()).limit(limit).all()


def get_all_reward_logs(db: Session, skip: int = 0, limit: int = 100) -> list[models.RewardLog]:
    """获取所有奖励日志"""
    return db.query(models.RewardLog).order_by(
        models.RewardLog.created_at.desc()
    ).offset(skip).limit(limit).all()


def get_dashboard_stats(db: Session) -> schemas.DashboardStats:
    """
    获取仪表盘统计数据
    
    包含：总用户数、总答题次数、总答对次数、待领奖励、已发奖励、各题库状态
    """
    total_users = db.query(func.count(models.User.id)).scalar()
    total_answers = db.query(func.count(models.SessionAnswer.id)).scalar()
    total_correct = db.query(func.count(models.SessionAnswer.id)).filter(
        models.SessionAnswer.is_correct == True
    ).scalar()
    
    reward_stats = db.query(
        func.sum(models.User.reward_balance),
        func.sum(models.User.reward_claimed)
    ).first()
    
    total_reward_balance = reward_stats[0] or 0
    total_reward_claimed = reward_stats[1] or 0
    
    banks = get_all_bank_stats(db)
    
    return schemas.DashboardStats(
        total_users=total_users,
        total_answers=total_answers,
        total_correct=total_correct,
        total_reward_balance=total_reward_balance,
        total_reward_claimed=total_reward_claimed,
        banks=banks
    )


# ============ 题目管理 ============

def get_questions_by_bank(db: Session, bank_id: int) -> list[dict]:
    """获取题库下所有题目（管理后台用）"""
    questions = db.query(models.Question).filter(
        models.Question.bank_id == bank_id
    ).order_by(models.Question.id).all()
    
    result = []
    for q in questions:
        answered_by_nickname = None
        if q.answered_by_id:
            user = db.query(models.User).filter(models.User.id == q.answered_by_id).first()
            if user:
                answered_by_nickname = user.nickname
        
        result.append({
            "id": q.id,
            "bank_id": q.bank_id,
            "question_type": q.question_type,
            "content": q.content,
            "options": q.options,
            "correct_answer": q.correct_answer,
            "is_answered": q.is_answered,
            "answered_by_nickname": answered_by_nickname
        })
    return result


def create_question(db: Session, data: schemas.QuestionCreate) -> models.Question:
    """创建题目"""
    question = models.Question(
        bank_id=data.bank_id,
        question_type=data.question_type,
        content=data.content,
        options=data.options,
        correct_answer=data.correct_answer
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    return question


def delete_question(db: Session, question_id: int) -> bool:
    """删除题目"""
    question = db.query(models.Question).filter(models.Question.id == question_id).first()
    if not question:
        return False
    
    # 删除相关的答题记录
    db.query(models.SessionAnswer).filter(
        models.SessionAnswer.question_id == question_id
    ).delete()
    
    db.delete(question)
    db.commit()
    return True


def reset_all_data(db: Session) -> dict:
    """
    一键重置所有答题数据
    
    重置内容：
    - 所有题目的答题状态
    - 所有用户的答题统计和奖励
    - 删除所有会话和答题记录
    - 删除所有奖励日志
    """
    # 重置题目状态
    db.query(models.Question).update({
        models.Question.is_answered: False,
        models.Question.answered_by_id: None,
        models.Question.answered_at: None
    })
    
    # 删除答题记录
    answers_deleted = db.query(models.SessionAnswer).delete()
    
    # 删除会话
    sessions_deleted = db.query(models.QuizSession).delete()
    
    # 删除奖励日志
    logs_deleted = db.query(models.RewardLog).delete()
    
    # 重置用户统计
    users_reset = db.query(models.User).update({
        models.User.total_correct: 0,
        models.User.reward_balance: 0,
        models.User.reward_claimed: 0
    })
    
    db.commit()
    
    return {
        "questions_reset": db.query(models.Question).count(),
        "answers_deleted": answers_deleted,
        "sessions_deleted": sessions_deleted,
        "logs_deleted": logs_deleted,
        "users_reset": users_reset
    }


def reset_bank_questions(db: Session, bank_id: int) -> int:
    """重置单个题库的答题状态"""
    # 获取题库下所有题目 ID
    question_ids = [q.id for q in db.query(models.Question.id).filter(
        models.Question.bank_id == bank_id
    ).all()]
    
    if not question_ids:
        return 0
    
    # 删除相关答题记录
    db.query(models.SessionAnswer).filter(
        models.SessionAnswer.question_id.in_(question_ids)
    ).delete(synchronize_session=False)
    
    # 删除相关会话
    db.query(models.QuizSession).filter(
        models.QuizSession.bank_id == bank_id
    ).delete(synchronize_session=False)
    
    # 重置题目状态
    count = db.query(models.Question).filter(
        models.Question.bank_id == bank_id
    ).update({
        models.Question.is_answered: False,
        models.Question.answered_by_id: None,
        models.Question.answered_at: None
    }, synchronize_session=False)
    
    db.commit()
    return count
