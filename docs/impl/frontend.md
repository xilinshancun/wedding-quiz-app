# 前端页面说明

## 页面结构

```
src/
├── pages/
│   ├── Welcome.tsx      # 来宾首页/题库入口
│   ├── Quiz.tsx         # 答题页面
│   ├── Profile.tsx      # 个人奖励页面
│   ├── Display.tsx      # 公共展示页
│   └── admin/
│       ├── Login.tsx    # 管理员登录
│       ├── Dashboard.tsx # 管理后台首页
│       ├── Users.tsx    # 用户列表
│       ├── UserDetail.tsx # 用户详情/发奖
│       └── Logs.tsx     # 操作日志
├── api.ts               # API 调用封装
├── App.tsx              # 路由配置
└── index.css            # 全局样式
```

## 来宾端页面

### Welcome（首页/题库入口）

**路由**：`/` 或 `/bank/:bankId`

**功能**：
- 显示用户信息（昵称、识别码、答对数、奖励数）
- 如果通过 `/bank/:bankId` 进入，显示指定题库信息
- 否则显示所有题库列表
- 点击开始答题进入答题页面

**设计风格**：
- 婚礼红色主题
- 卡片式布局
- 花朵装饰背景

### Quiz（答题页面）

**路由**：`/quiz/:sessionId`

**功能**：
- 显示当前题目（单选题或填空题）
- 显示答题进度（第 X/3 题）
- 提交答案后显示结果
- 答对显示奖励动画
- 完成 3 题或题库抢光后显示结束页面

**状态流转**：
```
loading → question → result → question/completed/exhausted
```

### Profile（个人奖励页面）

**路由**：`/profile`

**功能**：
- 显示用户信息和识别码（用于领奖）
- 显示累计答对数、可领奖励、已领取数
- 显示奖励变动记录

## 公共展示页

### Display（投屏展示）

**路由**：`/display`

**功能**：
- 以灯笼形式展示所有题库
- 每个题库显示二维码、剩余题数、答题人数
- 每 5 秒自动刷新数据
- 题库抢光时显示"已抢光"标记

**设计风格**：
- 深红色背景
- 金色装饰
- 灯笼造型卡片

## 管理后台

### Login（登录页）

**路由**：`/admin`

**功能**：
- 管理员登录表单
- 登录成功后跳转到 Dashboard

### Dashboard（仪表盘）

**路由**：`/admin/dashboard`

**功能**：
- 显示总体统计数据
- 显示各题库状态
- 每 10 秒自动刷新

### Users（用户管理）

**路由**：`/admin/users`

**功能**：
- 用户列表（昵称、识别码、答对数、奖励数）
- 搜索用户（按昵称或识别码）
- 点击进入用户详情

### UserDetail（用户详情）

**路由**：`/admin/users/:userId`

**功能**：
- 显示用户详细信息
- 发放奖励（扣减可领数量）
- 增加奖励
- 扣减奖励
- 显示奖励变动记录

### Logs（操作日志）

**路由**：`/admin/logs`

**功能**：
- 显示所有奖励操作日志
- 包含时间、类型、数量、操作员、备注

## 样式设计

### 颜色主题

```css
--wedding-red: #D4374A;   /* 主色：婚礼红 */
--wedding-gold: #C9A962;  /* 强调色：金色 */
--wedding-pink: #F5E6E8;  /* 背景色：粉色 */
--wedding-cream: #FDF8F5; /* 背景色：米色 */
```

### 组件样式

- `.wedding-card`: 卡片容器
- `.wedding-btn`: 主按钮
- `.option-btn`: 选项按钮
- `.float-animation`: 浮动动画
- `.pulse-glow`: 发光动画

## 响应式设计

- 来宾端：针对手机优化（max-width: 448px）
- 展示页：支持大屏投影（grid 布局）
- 管理后台：支持桌面和平板

## 设备识别

通过 localStorage 存储设备 ID：

```typescript
function getDeviceId(): string {
  let deviceId = localStorage.getItem('wedding_device_id');
  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('wedding_device_id', deviceId);
  }
  return deviceId;
}
```

每次 API 请求都会在 `X-Device-ID` 头中携带此 ID。
