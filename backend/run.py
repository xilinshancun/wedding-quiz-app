"""
启动脚本 - 用于 IDE 直接运行

在 PyCharm 中右键点击此文件选择 Run 即可启动服务
"""
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
