# 婚礼现场扫码答题系统

一个婚礼现场互动答题 H5 系统，支持多题库、扫码答题、奖励管理等功能。

## 功能特性

- **来宾端**：扫码进入答题，每次最多答 3 题，答对获得奖励
- **公共展示页**：展示所有题库状态和二维码，适合现场投屏
- **管理后台**：查看统计数据、管理用户、发放/调整奖励

## 技术栈

- **前端**：React + TypeScript + Vite + TailwindCSS
- **后端**：Python + FastAPI + SQLAlchemy
- **数据库**：PostgreSQL

## 项目结构

```
wedding-quiz-app/
├── backend/                 # 后端代码
│   ├── app/
│   │   ├── main.py         # FastAPI 入口
│   │   ├── models.py       # 数据库模型
│   │   ├── schemas.py      # Pydantic 模型
│   │   ├── crud.py         # 数据库操作
│   │   ├── auth.py         # 认证逻辑
│   │   ├── utils.py        # 工具函数
│   │   ├── config.py       # 配置
│   │   ├── database.py     # 数据库连接
│   │   └── routers/        # API 路由
│   ├── scripts/
│   │   └── init_data.py    # 初始化示例数据
│   ├── requirements.txt
│   └── .env.example
├── frontend/                # 前端代码
│   ├── src/
│   │   ├── pages/          # 页面组件
│   │   ├── api.ts          # API 调用
│   │   ├── App.tsx         # 路由配置
│   │   └── index.css       # 样式
│   ├── package.json
│   └── .env.example
└── docs/                    # 文档
```

## 本地运行

### 1. 准备数据库

确保本地安装了 PostgreSQL，创建数据库：

```bash
createdb wedding_quiz
```

或使用 Docker：

```bash
docker run -d --name wedding-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=wedding_quiz \
  -p 5432:5432 \
  postgres:15
```

### 2. 启动后端

```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 启动服务（自动创建表和初始化示例数据）
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

> **注意**：后端启动时会自动完成以下操作：
> - 创建所有数据库表（如果不存在）
> - 初始化示例题库数据（如果数据库为空）
> 
> 如需自定义配置，可编辑 `backend/.env` 文件。

后端 API 文档：http://localhost:8000/docs

### 3. 启动前端

```bash
cd frontend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env

# 启动开发服务器
npm run dev
```

前端访问：http://localhost:5173

## 手机扫码测试

1. 确保手机和电脑在同一局域网
2. 获取电脑的局域网 IP（如 `192.168.1.100`）
3. 手机访问 `http://192.168.1.100:5173`
4. 访问 `http://192.168.1.100:5173/display` 查看公共展示页，扫描二维码测试

## 页面说明

| 路径 | 说明 |
|------|------|
| `/` | 来宾首页，选择题库 |
| `/bank/:id` | 指定题库入口（二维码链接） |
| `/quiz/:sessionId` | 答题页面 |
| `/profile` | 个人奖励页面 |
| `/display` | 公共展示页（投屏用） |
| `/admin` | 管理后台登录 |
| `/admin/dashboard` | 管理后台首页 |
| `/admin/users` | 用户管理 |
| `/admin/users/:id` | 用户详情/发奖 |
| `/admin/logs` | 操作日志 |

## 默认管理员账号

- 用户名：`admin`
- 密码：`admin123`

## 环境变量

### 后端 (.env)

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/wedding_quiz
JWT_SECRET=your-secret-key-change-in-production
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
HOST=0.0.0.0
PORT=8000
FRONTEND_URL=http://localhost:5173
```

### 前端 (.env)

```
VITE_API_URL=http://localhost:8000
```

## Azure 部署建议

### 后端部署

1. 使用 Azure App Service (Linux) 或 Azure Container Apps
2. 配置 PostgreSQL：使用 Azure Database for PostgreSQL
3. 环境变量通过 Azure 配置设置

```bash
# 构建 Docker 镜像
docker build -t wedding-quiz-backend ./backend

# 推送到 Azure Container Registry
az acr login --name <registry-name>
docker tag wedding-quiz-backend <registry-name>.azurecr.io/wedding-quiz-backend
docker push <registry-name>.azurecr.io/wedding-quiz-backend
```

### 前端部署

1. 使用 Azure Static Web Apps 或 Azure Blob Storage + CDN
2. 构建生产版本：

```bash
cd frontend
npm run build
# dist 目录即为静态文件
```

### 数据库

使用 Azure Database for PostgreSQL Flexible Server：

```bash
az postgres flexible-server create \
  --name wedding-quiz-db \
  --resource-group <resource-group> \
  --location eastasia \
  --admin-user postgres \
  --admin-password <password> \
  --sku-name Standard_B1ms
```

## 核心业务逻辑

1. **设备识别**：通过 localStorage 存储设备 ID，同一设备始终关联同一用户
2. **题目竞争**：答对的题目全局下线，使用数据库行锁保证并发安全
3. **会话管理**：每次扫码开启新会话，最多答 3 题，未完成会话可恢复
4. **奖励追踪**：所有奖励变动记录日志，支持发放、增加、扣减操作

## License

MIT
