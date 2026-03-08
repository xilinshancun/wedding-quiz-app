"""
答案处理工具函数
"""
import re
import unicodedata


def normalize_answer(answer: str) -> str:
    """
    归一化答案用于比较
    
    处理：
    - 去除首尾空格
    - 转小写
    - Unicode 归一化
    - 去除中英文标点和空格
    """
    if not answer:
        return ""
    
    result = answer.strip()
    result = result.lower()
    result = unicodedata.normalize("NFKC", result)
    # 去除中文标点
    result = re.sub(r'[，。、；：""''！？\s]+', '', result)
    # 去除英文标点
    result = re.sub(r'[,.\s;:\'"!?]+', '', result)
    
    return result


def check_answer(user_answer: str, correct_answer: str) -> bool:
    """
    检查答案是否正确
    
    支持多个可接受答案（用 | 分隔）
    例如：correct_answer = "玫瑰|玫瑰花" 表示两个答案都正确
    """
    if not user_answer or not user_answer.strip():
        return False
    
    user_normalized = normalize_answer(user_answer)
    
    acceptable_answers = correct_answer.split("|")
    for ans in acceptable_answers:
        if normalize_answer(ans) == user_normalized:
            return True
    
    return False
