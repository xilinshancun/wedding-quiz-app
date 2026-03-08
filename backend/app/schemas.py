"""
Pydantic 模型定义

用于 API 请求和响应的数据验证
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from .models import QuestionType, RewardLogType


# ============ 题库相关 ============

class QuestionBankBase(BaseModel):
    name: str
    description: Optional[str] = None


class QuestionBankCreate(QuestionBankBase):
    pass


class QuestionBankResponse(QuestionBankBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class QuestionBankStatus(BaseModel):
    """题库状态"""
    id: int
    name: str
    total_questions: int       # 总题数
    remaining_questions: int   # 剩余未答对题数
    available_questions: int   # 剩余空闲题目（未被锁定）
    active_players: int        # 正在答题人数


# ============ 题目相关 ============

class QuestionBase(BaseModel):
    question_type: QuestionType
    content: str
    options: Optional[str] = None
    correct_answer: str


class QuestionCreate(QuestionBase):
    bank_id: int


class QuestionResponse(BaseModel):
    """题目响应（不包含答案）"""
    id: int
    question_type: QuestionType
    content: str
    options: Optional[str] = None

    class Config:
        from_attributes = True


# ============ 用户相关 ============

class UserResponse(BaseModel):
    """用户信息"""
    id: int
    nickname: str
    display_code: str
    total_correct: int
    reward_balance: int
    reward_claimed: int
    created_at: datetime
    last_active_at: datetime

    class Config:
        from_attributes = True


class UserBrief(BaseModel):
    """用户简要信息"""
    nickname: str
    display_code: str
    total_correct: int
    reward_balance: int


# ============ 会话相关 ============

class SessionResponse(BaseModel):
    """答题会话"""
    id: int
    bank_id: int
    bank_name: str
    questions_answered: int
    questions_correct: int
    is_completed: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AnswerSubmit(BaseModel):
    """提交答案请求"""
    session_id: int
    question_id: int
    answer: str


class AnswerResult(BaseModel):
    """答题结果"""
    is_correct: bool
    got_reward: bool
    message: str
    user_total_correct: int
    user_reward_balance: int
    session_questions_answered: int
    session_is_completed: bool


class NextQuestionResponse(BaseModel):
    """获取下一题响应"""
    question: Optional[QuestionResponse] = None
    session_completed: bool
    bank_exhausted: bool
    message: str


# ============ 奖励相关 ============

class RewardLogResponse(BaseModel):
    """奖励日志"""
    id: int
    log_type: RewardLogType
    amount: int
    balance_after: int
    note: Optional[str]
    admin_operator: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class RewardAdjust(BaseModel):
    """奖励调整请求"""
    user_id: int
    amount: int
    note: Optional[str] = None


# ============ 管理后台相关 ============

class AdminLogin(BaseModel):
    """管理员登录请求"""
    username: str
    password: str


class AdminToken(BaseModel):
    """管理员登录响应"""
    access_token: str
    token_type: str = "bearer"


class DashboardStats(BaseModel):
    """仪表盘统计数据"""
    total_users: int
    total_answers: int
    total_correct: int
    total_reward_balance: int
    total_reward_claimed: int
    banks: list[QuestionBankStatus]
