"""
数据库模型定义

包含以下模型：
- QuestionBank: 题库
- Question: 题目
- User: 用户
- QuizSession: 答题会话
- SessionAnswer: 会话答题记录
- RewardLog: 奖励日志
"""
import random
from datetime import datetime
from enum import Enum
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum as SQLEnum, Index
)
from sqlalchemy.orm import relationship
from .database import Base


# 随机昵称生成用的词库
ADJECTIVES = [
    "快乐", "幸福", "甜蜜", "温馨", "浪漫", "可爱", "活泼",
    "开心", "欢乐", "阳光", "灿烂", "闪亮", "带劲", "排场",
    "利落", "精贵", "得劲", "美滋滋", "热乎乎", "香喷喷"
]

NOUNS = [
    "格拉条", "枕头馍", "撒汤", "卷馍", "太和板面", "粉鸡",
    "地锅鸡", "焦馍", "马糊", "瓠子馍", "牛肉汤", "烧饼",
    "咸鸭蛋", "落生", "秫秫", "不冷谷子", "老鸹", "蛤蟆",
    "小半拉决子", "憨熊", "椰熊", "灯笼"
]


def generate_nickname() -> str:
    """生成随机昵称，格式：形容词+的+名词+数字"""
    adj = random.choice(ADJECTIVES)
    noun = random.choice(NOUNS)
    num = random.randint(100, 999)
    return f"{adj}的{noun}{num}"


class QuestionType(str, Enum):
    """题目类型"""
    SINGLE_CHOICE = "single_choice"  # 单选题
    FILL_BLANK = "fill_blank"        # 填空题


class RewardLogType(str, Enum):
    """奖励日志类型"""
    ANSWER_CORRECT = "answer_correct"      # 答题正确获得
    ADMIN_DISTRIBUTE = "admin_distribute"  # 管理员发放（扣减余额）
    ADMIN_ADD = "admin_add"                # 管理员增加
    ADMIN_DEDUCT = "admin_deduct"          # 管理员扣减


class QuestionBank(Base):
    """题库表"""
    __tablename__ = "question_banks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)          # 题库名称
    description = Column(Text, nullable=True)           # 题库描述
    created_at = Column(DateTime, default=datetime.utcnow)

    questions = relationship("Question", back_populates="bank")


class Question(Base):
    """题目表"""
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    bank_id = Column(Integer, ForeignKey("question_banks.id"), nullable=False)
    question_type = Column(SQLEnum(QuestionType), nullable=False)  # 题目类型
    content = Column(Text, nullable=False)              # 题目内容
    options = Column(Text, nullable=True)               # 选项（用 | 分隔）
    correct_answer = Column(Text, nullable=False)       # 正确答案（多个用 | 分隔）
    is_answered = Column(Boolean, default=False, index=True)  # 是否已被答对
    answered_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # 答对者
    answered_at = Column(DateTime, nullable=True)       # 答对时间
    created_at = Column(DateTime, default=datetime.utcnow)

    bank = relationship("QuestionBank", back_populates="questions")
    answered_by = relationship("User", back_populates="answered_questions")

    __table_args__ = (
        Index("ix_questions_bank_answered", "bank_id", "is_answered"),  # 加速获取可用题目
    )


class User(Base):
    """用户表"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(100), unique=True, nullable=False, index=True)  # 设备标识
    nickname = Column(String(50), nullable=False)       # 随机昵称
    display_code = Column(String(20), unique=True, nullable=False, index=True)  # 展示码（用于领奖）
    total_correct = Column(Integer, default=0)          # 累计答对数
    reward_balance = Column(Integer, default=0)         # 可领奖励数
    reward_claimed = Column(Integer, default=0)         # 已领取数
    created_at = Column(DateTime, default=datetime.utcnow)
    last_active_at = Column(DateTime, default=datetime.utcnow)

    sessions = relationship("QuizSession", back_populates="user")
    answered_questions = relationship("Question", back_populates="answered_by")
    reward_logs = relationship("RewardLog", back_populates="user")

    @staticmethod
    def generate_display_code() -> str:
        """生成展示码，格式：G + 5位数字"""
        return f"G{random.randint(10000, 99999)}"


class QuizSession(Base):
    """答题会话表"""
    __tablename__ = "quiz_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    bank_id = Column(Integer, ForeignKey("question_banks.id"), nullable=False)
    questions_answered = Column(Integer, default=0)     # 已答题数
    questions_correct = Column(Integer, default=0)      # 答对题数
    is_completed = Column(Boolean, default=False)       # 是否完成
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)      # 完成时间

    user = relationship("User", back_populates="sessions")
    bank = relationship("QuestionBank")
    answers = relationship("SessionAnswer", back_populates="session")

    __table_args__ = (
        Index("ix_sessions_user_bank_completed", "user_id", "bank_id", "is_completed"),  # 查找未完成会话
    )


class SessionAnswer(Base):
    """会话答题记录表"""
    __tablename__ = "session_answers"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("quiz_sessions.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    user_answer = Column(Text, nullable=False)          # 用户答案
    is_correct = Column(Boolean, nullable=False)        # 是否正确
    got_reward = Column(Boolean, default=False)         # 是否获得奖励
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("QuizSession", back_populates="answers")
    question = relationship("Question")


class RewardLog(Base):
    """奖励日志表"""
    __tablename__ = "reward_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    log_type = Column(SQLEnum(RewardLogType), nullable=False)  # 日志类型
    amount = Column(Integer, nullable=False)            # 变动数量
    balance_after = Column(Integer, nullable=False)     # 变动后余额
    note = Column(Text, nullable=True)                  # 备注
    admin_operator = Column(String(50), nullable=True)  # 操作管理员
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="reward_logs")
