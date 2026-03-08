# 数据库设计

## ER 图

```
┌──────────────────┐       ┌──────────────────┐
│  question_banks  │       │     questions    │
├──────────────────┤       ├──────────────────┤
│ id (PK)          │◄──────│ bank_id (FK)     │
│ name             │       │ id (PK)          │
│ description      │       │ question_type    │
│ created_at       │       │ content          │
└──────────────────┘       │ options          │
                           │ correct_answer   │
                           │ is_answered      │
┌──────────────────┐       │ answered_by_id   │──┐
│      users       │       │ answered_at      │  │
├──────────────────┤       │ created_at       │  │
│ id (PK)          │◄──────┴──────────────────┘  │
│ device_id (UQ)   │                             │
│ nickname         │◄────────────────────────────┘
│ display_code (UQ)│
│ total_correct    │       ┌──────────────────┐
│ reward_balance   │       │  quiz_sessions   │
│ reward_claimed   │       ├──────────────────┤
│ created_at       │◄──────│ user_id (FK)     │
│ last_active_at   │       │ bank_id (FK)     │
└──────────────────┘       │ id (PK)          │
        │                  │ questions_answered│
        │                  │ questions_correct │
        │                  │ is_completed      │
        │                  │ created_at        │
        │                  │ completed_at      │
        │                  └──────────────────┘
        │                           │
        │                           ▼
        │                  ┌──────────────────┐
        │                  │ session_answers  │
        │                  ├──────────────────┤
        │                  │ id (PK)          │
        │                  │ session_id (FK)  │
        │                  │ question_id (FK) │
        │                  │ user_answer      │
        │                  │ is_correct       │
        │                  │ got_reward       │
        │                  │ created_at       │
        │                  └──────────────────┘
        │
        ▼
┌──────────────────┐
│   reward_logs    │
├──────────────────┤
│ id (PK)          │
│ user_id (FK)     │
│ log_type         │
│ amount           │
│ balance_after    │
│ note             │
│ admin_operator   │
│ created_at       │
└──────────────────┘
```

## 表结构详情

### question_banks（题库表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| name | VARCHAR(100) | 题库名称 |
| description | TEXT | 题库描述 |
| created_at | TIMESTAMP | 创建时间 |

### questions（题目表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| bank_id | INTEGER | 所属题库 ID |
| question_type | ENUM | 题目类型：single_choice/fill_blank |
| content | TEXT | 题目内容 |
| options | TEXT | 选项（用 \| 分隔） |
| correct_answer | TEXT | 正确答案（多个用 \| 分隔） |
| is_answered | BOOLEAN | 是否已被答对 |
| answered_by_id | INTEGER | 答对者用户 ID |
| answered_at | TIMESTAMP | 答对时间 |
| created_at | TIMESTAMP | 创建时间 |

**索引**：
- `ix_questions_bank_answered` (bank_id, is_answered) - 加速获取可用题目

### users（用户表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| device_id | VARCHAR(100) | 设备标识（唯一） |
| nickname | VARCHAR(50) | 随机昵称 |
| display_code | VARCHAR(20) | 展示码（唯一，如 G12345） |
| total_correct | INTEGER | 累计答对数 |
| reward_balance | INTEGER | 可领奖励数 |
| reward_claimed | INTEGER | 已领取数 |
| created_at | TIMESTAMP | 创建时间 |
| last_active_at | TIMESTAMP | 最后活跃时间 |

### quiz_sessions（答题会话表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| user_id | INTEGER | 用户 ID |
| bank_id | INTEGER | 题库 ID |
| questions_answered | INTEGER | 已答题数 |
| questions_correct | INTEGER | 答对题数 |
| is_completed | BOOLEAN | 是否完成 |
| created_at | TIMESTAMP | 创建时间 |
| completed_at | TIMESTAMP | 完成时间 |

**索引**：
- `ix_sessions_user_bank_completed` (user_id, bank_id, is_completed) - 查找未完成会话

### session_answers（会话答题记录表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| session_id | INTEGER | 会话 ID |
| question_id | INTEGER | 题目 ID |
| user_answer | TEXT | 用户答案 |
| is_correct | BOOLEAN | 是否正确 |
| got_reward | BOOLEAN | 是否获得奖励 |
| created_at | TIMESTAMP | 创建时间 |

### reward_logs（奖励日志表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| user_id | INTEGER | 用户 ID |
| log_type | ENUM | 日志类型 |
| amount | INTEGER | 变动数量 |
| balance_after | INTEGER | 变动后余额 |
| note | TEXT | 备注 |
| admin_operator | VARCHAR(50) | 操作管理员 |
| created_at | TIMESTAMP | 创建时间 |

**log_type 枚举值**：
- `answer_correct` - 答题正确获得
- `admin_distribute` - 管理员发放（扣减余额）
- `admin_add` - 管理员增加
- `admin_deduct` - 管理员扣减

## 并发控制

### 题目答对判定

```sql
-- 使用 FOR UPDATE 锁定行
SELECT * FROM questions WHERE id = ? FOR UPDATE;

-- 检查是否已被答对
IF is_answered = FALSE THEN
    UPDATE questions SET is_answered = TRUE, answered_by_id = ?, answered_at = NOW();
    -- 发放奖励
END IF;
```

### 奖励操作

```sql
-- 使用事务保证原子性
BEGIN;
SELECT * FROM users WHERE id = ? FOR UPDATE;
UPDATE users SET reward_balance = reward_balance - ?;
INSERT INTO reward_logs (...);
COMMIT;
```
