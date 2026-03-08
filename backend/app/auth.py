"""
认证模块

提供管理员登录验证和 JWT Token 管理
"""
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .config import get_settings

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24  # Token 有效期 24 小时


def verify_admin(username: str, password: str) -> bool:
    """验证管理员账号密码"""
    return username == settings.admin_username and password == settings.admin_password


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """创建 JWT Token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=ALGORITHM)


def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """
    获取当前管理员
    
    从请求头中提取 JWT Token 并验证
    返回管理员用户名
    """
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无效的认证凭据",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        return username
    except JWTError:
        raise credentials_exception
