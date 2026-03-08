#!/bin/bash
# 婚礼答题系统 - Azure App Service 部署脚本
# 
# 使用方法：
#   chmod +x deploy.sh
#   ./deploy.sh
#
# 前提条件：
#   1. 已安装 Azure CLI 并登录 (az login)
#   2. 已安装 Node.js 和 npm
#   3. 已创建 Azure 资源（见下方说明）

set -e

# ============ 配置区域（请根据实际情况修改） ============
RESOURCE_GROUP="wedding-quiz-rg"
APP_SERVICE_NAME="wedding-quiz-app"
LOCATION="eastasia"

# 数据库连接（从 Azure Portal 获取）
DATABASE_URL="postgresql://quizdbowner:Garden%40Wedding_2026_DB%217@wedding-quiz-app.postgres.database.azure.com:5432/postgres?sslmode=require"

# ============ 步骤 1：构建前端 ============
echo "📦 正在构建前端..."
cd frontend
npm install
npm run build
cd ..

# ============ 步骤 2：复制前端到后端 static 目录 ============
echo "📁 正在复制前端文件..."
rm -rf backend/static
cp -r frontend/dist backend/static

# ============ 步骤 3：打包部署文件 ============
echo "📦 正在打包部署文件..."
cd backend
zip -r ../deploy.zip . -x "*.pyc" -x "__pycache__/*" -x ".env" -x "venv/*" -x ".git/*"
cd ..

# ============ 步骤 4：部署到 Azure ============
echo "🚀 正在部署到 Azure App Service..."
az webapp deploy \
    --resource-group $RESOURCE_GROUP \
    --name $APP_SERVICE_NAME \
    --src-path deploy.zip \
    --type zip

# ============ 步骤 5：配置环境变量 ============
echo "⚙️ 正在配置环境变量..."
az webapp config appsettings set \
    --resource-group $RESOURCE_GROUP \
    --name $APP_SERVICE_NAME \
    --settings \
    DATABASE_URL="$DATABASE_URL" \
    JWT_SECRET="$(openssl rand -hex 32)" \
    ADMIN_USERNAME="admin" \
    ADMIN_PASSWORD="admin123" \
    SCM_DO_BUILD_DURING_DEPLOYMENT="true"

# ============ 步骤 6：配置启动命令 ============
echo "⚙️ 正在配置启动命令..."
az webapp config set \
    --resource-group $RESOURCE_GROUP \
    --name $APP_SERVICE_NAME \
    --startup-file "gunicorn --bind=0.0.0.0 --timeout 600 app.main:app -k uvicorn.workers.UvicornWorker"

# ============ 清理 ============
rm -f deploy.zip

echo ""
echo "✅ 部署完成！"
echo "🌐 访问地址: https://${APP_SERVICE_NAME}.azurewebsites.net"
echo ""
echo "📋 后续步骤："
echo "   1. 在 Azure Portal 检查应用状态"
echo "   2. 查看日志: az webapp log tail --resource-group $RESOURCE_GROUP --name $APP_SERVICE_NAME"
echo "   3. 访问管理后台: https://${APP_SERVICE_NAME}.azurewebsites.net/admin"
