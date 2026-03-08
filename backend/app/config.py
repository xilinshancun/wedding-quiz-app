"""
应用配置

从环境变量读取配置项
"""
from typing import Optional
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # 数据库连接
    database_url: str = "postgresql://postgres:postgres@localhost:5432/wedding_quiz"
    
    # SOCKS 代理（本地开发用，部署时留空）
    socks_proxy_host: Optional[str] = None
    socks_proxy_port: Optional[int] = None
    
    # JWT 密钥（生产环境请更换）
    jwt_secret: str = "your-secret-key-change-in-production"
    
    # 管理员账号
    admin_username: str = "admin"
    admin_password: str = "admin123"
    
    # 重置密码（用于一键重置功能）
    reset_password: str = "linjiu1024"
    
    # 服务器配置
    host: str = "0.0.0.0"
    port: int = 8000
    
    # 前端 URL（用于 CORS）
    frontend_url: str = "http://localhost:5173"

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    """获取配置单例"""
    return Settings()
