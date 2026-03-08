"""
代理初始化模块

在应用启动时设置 SOCKS 代理，必须在导入数据库模块之前调用
"""
import os
import socket

_original_socket = socket.socket
_proxy_initialized = False


def init_socks_proxy():
    """初始化 SOCKS 代理（如果配置了的话）"""
    global _proxy_initialized
    
    if _proxy_initialized:
        return
    
    socks_host = os.getenv("SOCKS_PROXY_HOST")
    socks_port = os.getenv("SOCKS_PROXY_PORT")
    
    if socks_host and socks_port:
        try:
            import socks
            socks.set_default_proxy(socks.SOCKS5, socks_host, int(socks_port))
            socket.socket = socks.socksocket
            print(f"已启用 SOCKS5 代理: {socks_host}:{socks_port}")
            _proxy_initialized = True
        except ImportError:
            print("警告: 未安装 pysocks，无法使用代理。请运行: pip install pysocks")


# 模块加载时自动初始化
from dotenv import load_dotenv
load_dotenv()
init_socks_proxy()
