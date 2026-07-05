# VChat

VChat 是一个基于 Next.js 16、React 19 和 TypeScript 的 AI 多模型聊天系统。项目支持 DeepSeek、Qwen 模型接入，提供流式对话、会话持久化、上下文管理、Prompt 模板、轻量长期记忆、AI 角色化交互和专业模式参数配置。

## 技术栈

- Next.js 16、React 19、TypeScript
- Tailwind CSS、Zustand、use-immer
- Drizzle ORM、PostgreSQL、pgvector
- OpenAI SDK 兼容接口、DashScope Embedding API
- MarkdownIt、react-virtuoso
- Zod、Vitest、Testing Library
- Storybook、ESLint、Prettier、lint-staged、Husky

## 运行环境

项目和 CI 对齐 Node 20：

```bash
node >=20 <21
npm >=10 <11
```

建议使用 Node 20 和 npm 10。本地如果出现 `EBADENGINE`，优先切换 Node/npm 版本，不要直接放宽 `package.json` 的 `engines`。

## 快速开始

安装依赖：

```bash
npm ci
```

本地开发：

```bash
npm run dev
```

访问：

```text
http://localhost:3000
```

生产构建和启动：

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
```

说明：

- `DATABASE_URL`：PostgreSQL 连接地址，Drizzle ORM 使用。
- `DEEPSEEK_API_KEY` / `QWEN_API_KEY`：模型服务密钥，至少配置一个可用提供方。
- `DASHSCOPE_API_KEY`：用于 Embedding 和长期记忆。
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`：登录认证 token 签名密钥。
- `LOG_TO_FILE`：需要文件日志时设为 `true`。
- `LOG_DIR`：文件日志输出目录，默认 `logs`。

## 常用命令

```bash
npm run dev                # 启动开发服务
npm run build              # 生产构建
npm run start              # 启动生产服务
npm run typecheck          # TypeScript 类型检查
npm run lint               # ESLint 检查
npm run test               # Vitest 全量测试
npm run test:watch         # Vitest watch 模式
npm run format             # Prettier 格式化
npm run format:check       # Prettier 格式检查
npm run check              # typecheck + lint + test + build
npm run storybook          # 启动 Storybook
npm run build-storybook    # 构建 Storybook 静态产物
npm run db:push            # 同步 Drizzle schema
npm run db:seed            # 初始化种子数据
npm run db:studio          # 打开 Drizzle Studio
```

专项检查：

```bash
npm run check:markdown-sanitize
npm run check:chat-context
npm run check:sse-stream
```

## 数据库准备

推荐使用 pgvector 镜像启动 PostgreSQL：

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

启用 pgvector 扩展：

```bash
docker exec -it vchat-postgres psql -U mumu -d vchat_db -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

同步表结构：

```bash
npm run db:push
```

初始化基础数据：

```bash
npm run db:seed
```

长期记忆表需要包含：

```text
embedding | vector(1024)
```

## 核心功能

- **流式聊天**：`POST /api/chat` 返回 NDJSON 流，前端实时追加 delta，并处理 metadata、done、error 等事件。
- **多模型接入**：通过 provider factory 统一 DeepSeek 和 Qwen 调用，当前模型包括 `deepseek-v4-pro`、`qwen-plus`、`qwen-turbo`。
- **AI 角色化**：聊天输入框旁提供圆形角色菜单，当前角色包括饮食、出行、情绪、学习。选择角色后会同步角色 `systemPrompt` 和默认生成参数。
- **会话内角色记忆**：角色选择按当前 conversation 记忆，切换会话时恢复对应会话角色，点击默认角色可恢复默认 Prompt 设置。
- **专业模式**：把生成参数和记忆设置收进统一弹窗，支持温度、Top P、最大 Token、系统提示词、长期记忆、会话摘要、相关历史和最近轮数设置。
- **长上下文管理**：结合会话摘要、相关历史、最近轮次、Token 预算和长期记忆，控制长对话上下文成本。
- **长期记忆**：基于 DashScope Embedding API 和 PostgreSQL pgvector 做 Top-K 语义召回，并注入 Prompt。
- **会话持久化**：使用 Drizzle 管理用户、会话、消息、Provider、refresh token 和长期记忆数据。

## 前后端数据边界

前端发送聊天请求时，可以携带：

- `promptSettings.templateId`：角色或场景模板 ID，例如 `role-food`、`role-travel`、`role-emotion`、`role-study`。
- `promptSettings.systemPrompt`：自定义系统提示词。
- `promptSettings.temperature`、`topP`、`maxTokens`：模型生成参数。
- `contextOptions.memoryEnabled`：是否启用长期记忆。
- `contextOptions.summaryEnabled`：是否启用会话摘要。
- `contextOptions.relevantHistoryEnabled`：是否召回相关历史。
- `contextOptions.recentTurns`：携带最近对话轮数。

后端 `src/app/api/chat/route.ts` 会解析这些字段，按模板默认值和前端显式值合并生成最终 Prompt 与模型参数。前端 DTO 和 UI Model 在边界层转换，避免接口 JSON 字段和 UI `Date` 对象混用。

## 组件分层

当前组件按职责分层：

- `src/components/Ui`：基础 UI 组件，只接收 props，不直接依赖 store 或服务端实现。
- `src/components/Chat`：聊天业务组件，包括输入框、消息展示、侧栏、角色菜单、工具栏等。
- `src/components/Prompt`：Prompt、专业模式、快捷配置相关组件。
- `src/components/Provider`：模型提供方选择组件。
- `src/app/**`：页面和路由入口。

已经沉淀的通用组件包括：

- `Button`
- `IconButton`
- `FormField`
- `ConfirmDialog`
- `ErrorState`
- `ChatToolbar`
- `SettingNumberField`
- `SettingToggleRow`
- `MessageBubbleView`
- `MessageActions`
- `MessageListView`
- `SidebarBody`
- `SidebarSettingsMenu`
- `SidebarToggleButton`

## AI 角色和 Prompt 配置

前端角色配置在：

```text
src/config/assistant-roles.ts
```

后端 Prompt 模板在：

```text
src/ai/prompt/prompt-templates.ts
src/ai/prompt/prompt-template-factory.ts
```

新增角色时需要同时考虑：

1. 前端角色展示配置：图标、颜色、说明、示例、`systemPrompt`、默认参数。
2. 后端模板 ID：保证 `templateId` 能被 `getPromptTemplate` 解析。
3. 测试：覆盖角色按钮展示、选择后 Prompt 参数同步、会话切换记忆。

## Storybook

Storybook 用于沉淀组件状态文档：

```bash
npm run storybook
npm run build-storybook
```

当前 stories 目录：

```text
src/stories/Ui
src/stories/Business
```

已覆盖的组件状态包括 Button、IconButton、FormField、ConfirmDialog、ErrorState、ProviderSelecter、MessageBubble、RoleRadialMenu、ProfessionalModePanel、SidebarParts 等。

如果遇到 Storybook 构建写用户目录失败，优先检查本机权限和缓存目录；项目配置已使用 `--disable-telemetry` 降低无关写入。

## 工程化约束

- `format` / `format:check`：统一 Prettier 格式化。
- `lint-staged`：提交前只处理暂存区改动文件。
- `Husky`：提交前自动触发 lint-staged。
- `engines`：锁定 Node 20 和 npm 10 范围。
- `ESLint import boundary`：限制前端组件、store、types、db 的越层依赖。
- `Storybook`：组件状态文档和视觉回归参考。
- `Vitest`：覆盖组件、store、API route、Prompt、上下文、SSE、日志、校验等测试。

当前 import boundary 的关键规则：

- `components` 和 `stores` 不直接引用 DB、服务端 auth、Route Handler、服务端 response 封装。
- `components/Ui` 不依赖 store 或服务端实现，只通过 props 接收数据和事件。
- `types` 只放纯类型和共享契约，不依赖组件、store、页面或服务端实现。
- `db` 不反向依赖组件、store 或页面层。

## 测试说明

全量测试：

```bash
npm run test
```

测试文件主要覆盖：

- 组件测试：RoleRadialMenu、ProfessionalModePanel、Sidebar、MessageBubbleView、ConfirmDialog、ErrorState、FormField、IconButton、ChatToolbar。
- store 测试：聊天 DTO hydration。
- API route 测试：register、logout、chat。
- AI 上下文测试：context builder、policy、message ranker、token estimator。
- Prompt 测试：prompt templates 和 template factory。
- 工具测试：markdown sanitize、SSE stream、validators、logger。

测试代码维护原则：

- 在单个测试文件内抽语义化 helper。
- 默认对象和 mock 数据用常量或 factory。
- 不为了复用把测试抽到难以阅读。
- 用户行为测试优先表达业务规则，而不是操作流水账。

## 项目结构

```text
src
├─ ai
│  ├─ context          # 上下文组装、摘要、相关历史、Token 估算
│  ├─ memory           # 长期记忆分析和 Embedding
│  ├─ prompt           # Prompt 模板和工厂
│  ├─ providers        # DeepSeek / Qwen Provider
│  └─ provider-factory.ts
├─ app
│  ├─ api              # Auth / Chat / Conversations / Providers API
│  ├─ auth             # 登录注册页面
│  ├─ conversation     # 会话页面
│  └─ settings
├─ components
│  ├─ Attachment       # 图片预览和上传入口
│  ├─ Chat             # 聊天窗口、消息、输入框、侧栏、角色菜单
│  ├─ Prompt           # Prompt 面板和专业模式
│  ├─ Provider         # 模型选择
│  └─ Ui               # 通用 UI 组件
├─ config              # 前端配置，如角色、Provider
├─ db                  # Drizzle schema 和 service
├─ hooks               # 前端 hooks
├─ lib                 # API 响应、错误处理、日志、工具函数
├─ stories             # Storybook stories
├─ stores              # Zustand 状态管理
├─ tests               # 页面和组件测试
└─ types               # DTO、UI Model 和共享类型
```

## 核心聊天流程

```text
用户输入
  -> 前端根据当前会话、模型、角色、专业模式参数组装请求
  -> Zustand 乐观插入用户消息和 AI loading 消息
  -> POST /api/chat
  -> 后端校验请求，解析 promptSettings 和 contextOptions
  -> 读取会话历史、摘要、长期记忆
  -> buildChatContext 组装 Prompt
  -> Provider 层调用 DeepSeek / Qwen
  -> ReadableStream 返回 metadata / delta / done / error
  -> 前端实时追加 AI 消息
  -> 完成后持久化消息，按需保存长期记忆和生成摘要
```

## Docker 部署

项目提供 `docker-compose.yml` 用于构建应用服务：

```bash
docker compose up -d --build
```

注意：当前 compose 主要覆盖应用服务，PostgreSQL 可单独部署，也可以按需补充到 compose 中。需要确保 `.env.local` 或部署环境中的 `DATABASE_URL` 指向可访问的数据库。

## 开发注意事项

- 不要提交 `.env`、`.env.local`、`.env.production` 里的真实密钥。
- 修改数据库 schema 后执行 `npm run db:push`。
- 修改环境变量后重启 `npm run dev`。
- 新增 Next.js App Router、Route Handler 或 server action 前，先阅读 `node_modules/next/dist/docs/` 中对应版本文档。
- 新增 UI 基础组件时保持 props 驱动，不直接读 store。
- 新增业务组件时优先复用 `Ui` 和已有 `Chat` / `Prompt` 组件。
- 新增 Prompt 角色时同步前端角色配置、后端模板和测试。
