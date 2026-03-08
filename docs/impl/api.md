# API 接口文档

## 基础信息

- 基础路径：`http://localhost:8000`
- 认证方式：JWT Bearer Token（仅管理接口需要）
- 设备识别：通过 `X-Device-ID` 请求头

## 来宾接口 `/api/guest`

### POST /api/guest/init
初始化或获取用户

**请求头**：
- `X-Device-ID`: 设备标识

**响应**：
```json
{
  "id": 1,
  "nickname": "快乐的小兔123",
  "display_code": "G12345",
  "total_correct": 0,
  "reward_balance": 0,
  "reward_claimed": 0,
  "created_at": "2024-01-01T00:00:00",
  "last_active_at": "2024-01-01T00:00:00"
}
```

### GET /api/guest/me
获取当前用户信息

### GET /api/guest/banks
获取所有题库状态

**响应**：
```json
[
  {
    "id": 1,
    "name": "新人故事",
    "total_questions": 10,
    "remaining_questions": 8,
    "active_players": 3
  }
]
```

### POST /api/guest/session/{bank_id}
开始或恢复答题会话

**响应**：
```json
{
  "id": 1,
  "bank_id": 1,
  "bank_name": "新人故事",
  "questions_answered": 0,
  "questions_correct": 0,
  "is_completed": false,
  "created_at": "2024-01-01T00:00:00"
}
```

### GET /api/guest/session/{session_id}/next
获取下一道题目

**响应**：
```json
{
  "question": {
    "id": 1,
    "question_type": "single_choice",
    "content": "新郎新娘是在哪里相识的？",
    "options": "A. 大学|B. 公司|C. 朋友介绍|D. 网络"
  },
  "session_completed": false,
  "bank_exhausted": false,
  "message": "第 1/3 题"
}
```

### POST /api/guest/answer
提交答案

**请求体**：
```json
{
  "session_id": 1,
  "question_id": 1,
  "answer": "B"
}
```

**响应**：
```json
{
  "is_correct": true,
  "got_reward": true,
  "message": "恭喜答对！获得1个奖励！",
  "user_total_correct": 1,
  "user_reward_balance": 1,
  "session_questions_answered": 1,
  "session_is_completed": false
}
```

### GET /api/guest/rewards
获取我的奖励记录

## 展示接口 `/api/display`

### GET /api/display/banks
获取所有题库状态（公共展示页用）

## 管理接口 `/api/admin`

所有管理接口（除登录外）需要 JWT Token 认证。

### POST /api/admin/login
管理员登录

**请求体**：
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**响应**：
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer"
}
```

### GET /api/admin/dashboard
获取仪表盘数据

**响应**：
```json
{
  "total_users": 50,
  "total_answers": 200,
  "total_correct": 150,
  "total_reward_balance": 100,
  "total_reward_claimed": 50,
  "banks": [...]
}
```

### GET /api/admin/banks
获取所有题库状态

### GET /api/admin/users
获取用户列表

**查询参数**：
- `q`: 搜索关键词（昵称或识别码）
- `skip`: 跳过数量
- `limit`: 返回数量

### GET /api/admin/users/{user_id}
获取用户详情

### GET /api/admin/users/{user_id}/rewards
获取用户奖励记录

### POST /api/admin/reward/distribute
发放奖励（扣减可领奖数量）

**请求体**：
```json
{
  "user_id": 1,
  "amount": 1,
  "note": "线下发奖"
}
```

### POST /api/admin/reward/add
增加奖励

### POST /api/admin/reward/deduct
扣减奖励

### GET /api/admin/logs
获取所有奖励日志

## 错误响应

```json
{
  "detail": "错误信息"
}
```

常见错误码：
- 400: 请求参数错误
- 401: 未认证或认证失败
- 404: 资源不存在
- 500: 服务器内部错误
