# 婚礼答题系统 - 前端

基于 React + TypeScript + Vite 构建的婚礼现场互动答题 H5 应用。

## 技术栈

- React 18
- TypeScript
- Vite
- TailwindCSS
- React Router

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 目录结构

```
src/
├── pages/           # 页面组件
│   ├── Welcome.tsx  # 来宾首页
│   ├── Quiz.tsx     # 答题页面
│   ├── Profile.tsx  # 个人奖励
│   ├── Display.tsx  # 公共展示页
│   └── admin/       # 管理后台
├── api.ts           # API 调用
├── App.tsx          # 路由配置
└── index.css        # 全局样式
```

## 环境变量

创建 `.env` 文件：

```
VITE_API_URL=http://localhost:8000
```

## 页面说明

| 路径 | 说明 |
|------|------|
| `/` | 来宾首页 |
| `/bank/:id` | 题库入口（二维码链接） |
| `/quiz/:id` | 答题页面 |
| `/profile` | 个人奖励 |
| `/display` | 公共展示页 |
| `/admin` | 管理后台 |
