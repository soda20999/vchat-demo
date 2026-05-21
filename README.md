# VChat - AI 多模型聊天系统

VChat 是一个基于 Next.js 16 + React 19 的 AI 多模型聊天系统，支持 DeepSeek / Qwen 模型切换、Token 级流式响应、场景化 Prompt、长对话上下文管理、会话持久化和基于 pgvector 的轻量级长期记忆。

## 技术栈

- Next.js 16 / React 19 / TypeScript
- Tailwind CSS / Zustand / use-immer
- Drizzle ORM / PostgreSQL / pgvector
- OpenAI SDK 兼容接口
- DashScope Embedding API
- MarkdownIt / react-virtuoso
- Docker

## 功能亮点

- **Token 级流式对话体验**：基于 `fetch`、`ReadableStream`、`TextDecoder` 和 NDJSON 事件实现流式输出，支持 Stop、Retry、异常兜底和消息状态更新。
- **多模型统一接入**：通过 OpenAI SDK 兼容封装统一 DeepSeek 与 Qwen 调用逻辑，当前支持 `deepseek-v4-pro`、`qwen-plus`、`qwen-turbo`。
- **场景化 Prompt 配置**：内置生活规划、饮食建议、写作润色、情绪支持等 Prompt 模板，并支持温度、Top-P、最大 Token 等参数配置。
- **长对话上下文管理**：结合会话摘要、相关历史召回、最近轮次保留和 Token 预算估算，降低长对话上下文膨胀带来的成本。
- **轻量级长期记忆能力**：基于 DashScope Embedding API + PostgreSQL pgvector 构建 Lightweight Vector Store，使用余弦相似度实现用户信息 Top-K 语义召回，并动态注入 Prompt。
- **会话与消息持久化**：使用 Drizzle ORM 管理用户、会话、消息、Provider、长期记忆等数据表。

## 项目结构

```text
src
├─ ai
│  ├─ context          # 上下文组装、摘要、相关历史、Token 估算
│  ├─ memory           # 长期记忆分析与 Embedding
│  ├─ prompt           # 场景化 Prompt 模板
│  ├─ providers        # DeepSeek / Qwen Provider
│  ├─ interface.ts
│  └─ provider-factory.ts
├─ app
│  ├─ api              # Auth / Chat / Conversations / Providers API
│  ├─ auth             # 登录注册页面
│  ├─ conversation     # 会话页面
│  └─ settings
├─ components
│  ├─ Chat             # 聊天窗口、消息列表、输入框、上下文开关
│  ├─ Prompt           # Prompt 模板与快捷入口
│  ├─ Provider         # 模型选择
│  └─ Ui               # 通用 UI 组件
├─ db
│  ├─ schema.ts        # Drizzle 数据表定义
│  └─ service          # 数据库读写逻辑
├─ stores              # Zustand 状态管理
├─ lib                 # API 响应、错误处理、工具函数
└─ types               # TypeScript 类型
```

## 核心流程

```text
用户输入
  ↓
Zustand 乐观插入用户消息和 AI loading 消息
  ↓
POST /api/chat
  ↓
读取会话历史、摘要、长期记忆
  ↓
buildChatContext 组装 Prompt
  ↓
OpenAI SDK 兼容层调用 DeepSeek / Qwen
  ↓
ReadableStream 流式返回 delta
  ↓
前端实时追加 AI 消息内容
  ↓
回复完成后持久化消息、保存长期记忆、按需生成摘要
```

## 环境变量

在项目根目录创建 `.env.local`：

```env
DATABASE_URL=postgres://username:password@localhost:5432/vchat_db

DEEPSEEK_API_KEY=your_deepseek_api_key
QWEN_API_KEY=your_qwen_api_key
DASHSCOPE_API_KEY=your_dashscope_api_key

JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

说明：

- `DATABASE_URL` 用于 Drizzle 连接 PostgreSQL。
- `DASHSCOPE_API_KEY` 用于 `text-embedding-v4` 生成长期记忆向量。
- 至少配置 `DEEPSEEK_API_KEY` 或 `QWEN_API_KEY` 中的一个。
- 数据库需要启用 `pgvector` 扩展。

## 数据库准备

如果使用 Docker 部署 PostgreSQL，推荐使用 pgvector 镜像：

```bash
docker run -d \
  --name vchat-postgres \
  -e POSTGRES_USER=mumu \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=vchat_db \
  -p 5432:5432 \
  --restart unless-stopped \
  pgvector/pgvector:pg16
```

进入数据库启用扩展：

```bash
docker exec -it vchat-postgres psql -U mumu -d vchat_db -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

同步表结构：

```bash
npm run db:push
```

检查长期记忆表：

```bash
docker exec -it vchat-postgres psql -U mumu -d vchat_db -c "\d user_memories"
```

需要看到：

```text
embedding | vector(1024)
```

## 本地启动

安装依赖：

```bash
npm install
```

启动开发环境：

```bash
npm run dev
```

访问：

```text
http://localhost:3000
```

构建生产版本：

```bash
npm run build
npm run start
```

## 常用命令

```bash
npm run dev        # 启动开发环境
npm run build      # 构建生产版本
npm run start      # 启动生产服务
npm run lint       # 代码检查
npm run db:push    # 同步 Drizzle schema
npm run db:studio  # 打开 Drizzle Studio
```

## 长期记忆测试

发送一条能触发记忆的消息：

```text
我喜欢晚上学习，而且希望你以后回答简短一点
```

等待 AI 回复完成后查询数据库：

```bash
docker exec -it vchat-postgres psql -U mumu -d vchat_db -c "SELECT id, content, category, keywords FROM user_memories ORDER BY id DESC LIMIT 5;"
```

再发送：

```text
你觉得我什么时候复习比较合适？
```

如果回答参考了“晚上学习”等信息，说明 Embedding + pgvector 召回和 Prompt 注入已生效。

## 数据表

- `users`：用户信息
- `refresh_tokens`：刷新令牌
- `providers`：模型供应商配置
- `conversations`：会话、标题、摘要、选中模型
- `messages`：用户消息和 AI 回复
- `user_memories`：长期记忆文本、分类、关键词、Embedding 向量

## Docker 部署

项目提供 `docker-compose.yml` 用于启动应用容器：

```bash
docker compose up -d --build
```

注意：当前 compose 文件只包含应用服务，PostgreSQL 需要单独部署或补充到 compose 中，并确保 `.env.local` 中的 `DATABASE_URL` 指向可访问的数据库。

## 注意事项

- 不要提交 `.env`、`.env.local`、`.env.production` 中的真实 API Key。
- 修改数据库 schema 后需要执行 `npm run db:push`。
- 服务端环境变量变更后建议重启 `npm run dev`。
- 如果删除了 App Router 路由但 build 仍引用旧路由，可清理 `.next` 后重新构建。
