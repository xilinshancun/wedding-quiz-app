"""
数据库连接配置

本地开发：使用 pg8000 + SOCKS 代理
Azure 部署：使用 psycopg2（无需代理）
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import get_settings

settings = get_settings()
db_url = settings.database_url
connect_args = {}

# 判断是否在 Azure 环境（Azure App Service 会设置 WEBSITE_SITE_NAME）
is_azure = os.getenv("WEBSITE_SITE_NAME") is not None

if is_azure:
    # Azure 环境：直接使用 psycopg2，无需代理
    # 确保使用标准 postgresql:// 驱动
    if "+pg8000" in db_url:
        db_url = db_url.replace("postgresql+pg8000://", "postgresql://", 1)
    # psycopg2 的 sslmode 通过 URL 参数传递，不需要 connect_args
else:
    # 本地开发：检查是否配置了代理
    socks_host = os.getenv("SOCKS_PROXY_HOST")
    socks_port = os.getenv("SOCKS_PROXY_PORT")
    
    if socks_host and socks_port:
        # 有代理配置：使用 pg8000 + SOCKS 代理
        from . import proxy_init  # noqa: F401
        
        if db_url.startswith("postgresql://") and "+pg8000" not in db_url:
            db_url = db_url.replace("postgresql://", "postgresql+pg8000://", 1)
            if "sslmode=" in db_url:
                db_url = db_url.split("?")[0]
        
        if "azure" in db_url.lower():
            connect_args["ssl_context"] = True
    # 无代理配置：使用默认 psycopg2

engine = create_engine(db_url, pool_pre_ping=True, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """获取数据库会话，用于 FastAPI 依赖注入"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
