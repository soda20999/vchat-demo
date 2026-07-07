# VChat

VChat 是一个基于 Next.js 16、React 19 和 TypeScript 的 AI 聊天系统。项目重点覆盖前端聊天体验、后端 API 数据流，以及一点 AI 工程能力：多模型接入、Prompt 模板、上下文管理、长期记忆和 Redis 高并发治理。

当前开发分支：`feature/main`

## 技术栈

- 前端：Next.js 16、React 19、TypeScript、Tailwind CSS、Zustand
- 后端：Next Route Handler、Drizzle ORM、PostgreSQL、JWT
- AI：OpenAI SDK 兼容接口、DeepSeek、Qwen、DashScope Embedding、pgvector
- 高并发治理：Redis、ioredis、Token Bucket、请求队列、分布式锁
- 工程化：Vitest、Playwright、ESLint、Prettier、Storybook、Husky、lint-staged、GitHub Actions

## 快速开始

项目要求 Node 24 和 npm 11：

```bash
node >=24 <25
npm >=11 <12
```

安装依赖：

```bash
npm ci
```

启动开发服务：

```bash
npm run dev
```

访问：

```text
http://127.0.0.1:3000
```

生产构建：

```bash
npm run build
npm run start
```

## 环境变量

复制 `.env.example` 为 `.env.local`，再填入本地配置：

```env
DATABASE_URL=postgres://username:password@localhost:5432/vchat_db

DEEPSEEK_API_KEY=your_deepseek_api_key
QWEN_API_KEY=your_qwen_api_key
DASHSCOPE_API_KEY=your_dashscope_api_key

JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret

LOG_TO_FILE=false
LOG_DIR=logs

REDIS_URL=redis://localhost:6379
AI_GOVERNANCE_ENABLED=true
AI_RATE_LIMIT_CAPACITY=20
AI_RATE_LIMIT_REFILL_PER_SECOND=1
AI_QUEUE_MAX_CONCURRENT=5
AI_QUEUE_WAIT_TIMEOUT_MS=10000
AI_QUEUE_ACTIVE_TTL_MS=180000
AI_QUEUE_POLL_INTERVAL_MS=100
AI_LOCK_TTL_MS=120000
AI_LOCK_RENEW_INTERVAL_MS=30000
AI_REDIS_COMMAND_TIMEOUT_MS=1000
```

如果 Redis 设置了密码，`REDIS_URL` 写成：

```env
REDIS_URL=redis://:your_password@127.0.0.1:6379
```

如果项目在本机运行、Redis 在 Linux 服务器 Docker 中，写 Linux 服务器真实 IP：

```env
REDIS_URL=redis://:your_password@your_server_ip:6379
```

## 数据库与 Redis

启动 PostgreSQL：

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

启用 pgvector：

```bash
docker exec -it vchat-postgres psql -U mumu -d vchat_db -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

同步表结构：

```bash
npm run db:push
```

启动 Redis：

```bash
docker run -d \
  --name vchat-redis \
  --restart unless-stopped \
  -p 6379:6379 \
  -v /home/mumu/redis/data:/data \
  redis:7-alpine \
  redis-server --appendonly yes --requirepass your_password
```

Redis 在项目里用于 AI 请求高并发治理：

- Token Bucket：限制单用户 AI 请求速率。
- 请求队列：控制同 provider/model 的并发量，削峰进入模型接口。
- 分布式锁：避免重复请求和同会话并发写入冲突。
- 命令超时：Redis 慢或被调试命令阻塞时，治理逻辑 fail-open，不中断聊天链路。

查看治理 key 时不要使用 `KEYS *`，建议使用：

```bash
docker exec -it vchat-redis redis-cli -a your_password --scan --pattern 'ai:*'
```

## 核心功能

- 流式聊天：`POST /api/chat` 返回 NDJSON 流，前端实时追加 AI delta。
- 多模型接入：通过 provider factory 统一 DeepSeek 和 Qwen 调用。
- 角色与 Prompt：支持饮食、出行、情绪、学习等角色模板，并可覆盖系统提示词和模型参数。
- 专业模式：支持温度、Top P、最大 Token、长期记忆、会话摘要、相关历史和最近轮数配置。
- 长上下文管理：结合摘要、相关历史、最近对话、Token 预算和长期记忆控制上下文成本。
- 长期记忆：使用 DashScope Embedding 和 PostgreSQL pgvector 做语义召回。
- 用户与会话：使用 Drizzle 管理用户、会话、消息、provider、refresh token 和记忆数据。
- AI 高并发治理：Redis 限流、排队和分布式锁保护模型接口、数据库写入和流式响应链路。

## 前后端与 AI 数据流

前端发送聊天请求时，会携带当前模型、会话、角色和专业模式配置：

- `promptSettings.templateId`
- `promptSettings.systemPrompt`
- `promptSettings.temperature`
- `promptSettings.topP`
- `promptSettings.maxTokens`
- `contextOptions.memoryEnabled`
- `contextOptions.summaryEnabled`
- `contextOptions.relevantHistoryEnabled`
- `contextOptions.recentTurns`

后端 `src/app/api/chat/route.ts` 负责校验请求、执行 Redis 治理、读取会话上下文、合并 Prompt 模板和前端配置，再调用 provider 层流式返回结果。消息完成后持久化到数据库，并按配置保存长期记忆或生成摘要。

核心链路：

```text
用户输入
  -> 前端组装 promptSettings / contextOptions
  -> POST /api/chat
  -> Redis 限流、队列、分布式锁
  -> 后端读取历史、摘要、记忆
  -> buildChatContext 组装 Prompt
  -> Provider 调用 DeepSeek / Qwen
  -> ReadableStream 返回 metadata / delta / done / error
  -> 前端实时更新消息
  -> 后端持久化消息、记忆和摘要
```

## 常用命令

```bash
npm run dev                # 启动开发服务
npm run build              # 生产构建
npm run start              # 启动生产服务
npm run typecheck          # TypeScript 类型检查
npm run lint               # ESLint 检查
npm run format             # Prettier 格式化
npm run format:check       # 检查代码格式
npm run test               # Vitest 全量测试
npm run test:unit          # Vitest 单元测试
npm run test:unit:ui       # 打开 Vitest UI
npm run test:e2e           # Playwright 端到端测试
npm run test:e2e:ui        # 打开 Playwright UI
npm run check              # typecheck + lint + test + build
npm run db:push            # 同步 Drizzle schema
npm run db:seed            # 初始化种子数据
npm run db:studio          # 打开 Drizzle Studio
npm run storybook          # 启动 Storybook
npm run build-storybook    # 构建 Storybook
```

## 前端工程化与测试

当前项目已经补齐基础工程化闭环：

- 代码规范：使用 ESLint 检查代码问题，使用 Prettier 统一格式。
- 类型检查：使用 `npm run typecheck` 检查 TypeScript 类型。
- 单元测试：使用 Vitest 覆盖函数、hooks、store、上下文构建等纯逻辑。
- 单元测试 UI：使用 `npm run test:unit:ui` 在浏览器里查看测试结果、筛选失败用例和调试日志。
- E2E 测试：使用 Playwright 覆盖真实浏览器里的页面访问、点击、输入、跳转和前后端接口衔接。
- E2E 调试 UI：使用 `npm run test:e2e:ui` 回放页面操作、查看 Locator、Console、Network、Errors 和截图附件。
- 组件文档：使用 Storybook 管理和预览可复用前端组件。
- 提交前检查：使用 Husky 和 lint-staged 在提交前处理改动文件的 lint/format。
- CI 验证：GitHub Actions 在提交或 PR 时运行 `npm run check`，覆盖 typecheck、lint、test 和 build。

开发时建议按场景选择验证方式：

```text
改函数、hooks、store、Prompt 上下文逻辑 -> npm run test:unit
调试单元测试细节 -> npm run test:unit:ui
改页面交互、登录注册、聊天发送流程 -> npm run test:e2e
调试真实浏览器操作步骤 -> npm run test:e2e:ui
提交前完整自检 -> npm run check
```

Vitest 和 Playwright 的分工：

- Vitest 更适合测代码逻辑，例如 token 估算、上下文拼装、消息筛选、组件状态和表单校验。
- Playwright 更适合测真实用户流程，例如打开登录页、切换注册、发送聊天消息、检查接口返回后的页面状态。
- Playwright 不能自动发现所有业务问题，需要把关键用户路径写成 E2E 用例后，才能稳定暴露交互和前后端衔接问题。

## 项目结构

```text
src
├─ ai                  # 上下文、记忆、Prompt、模型 provider
├─ app                 # 页面和 API Route Handler
├─ components          # Chat、Prompt、Provider、Ui 等前端组件
├─ config              # 前端角色和 provider 配置
├─ db                  # Drizzle schema 和 service
├─ hooks               # 前端 hooks
├─ lib                 # API 工具、日志、SSE、Redis 治理
├─ stores              # Zustand 状态管理
├─ stories             # Storybook stories
└─ types               # DTO、UI Model 和共享类型
```

Redis 相关后端代码集中在：

```text
src/lib/redis
├─ client.ts
├─ config.ts
├─ token-bucket.ts
├─ request-queue.ts
├─ distributed-lock.ts
└─ chat-governance.ts
```

## 开发注意事项

- 不要提交 `.env`、`.env.local`、`.env.production` 里的真实密钥。
- 修改环境变量后需要重启开发服务。
- 修改数据库 schema 后执行 `npm run db:push`。
- 新增 Route Handler、cookies、redirect 或 server action 前，先读 `node_modules/next/dist/docs/` 对应版本文档。
- 新增 Prompt 角色时，需要同步前端角色配置、后端 Prompt 模板和测试。
- 后端接口改动至少跑相关接口测试和 `npm run typecheck`。
