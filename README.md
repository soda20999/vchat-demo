# VChat - 下一代多模态 AI 聊天应用

VChat 是一款基于 Next.js 16、React 19 与 AI SDK 构建的多模态聊天应用，聚焦于流式对话、图片输入、会话持久化与多模型切换体验。它既可以作为 AI Chat 产品原型，也适合作为多供应商接入、对话状态管理与数据库建模的实践项目。

## 核心亮点

- **多模型自由切换**: 内置 Gemini、DeepSeek 两类 Provider，可按模型维度灵活选择。
- **多模态输入体验**: 支持文字与图片联合提问，适合视觉理解、截图分析等场景。
- **流式响应反馈**: 聊天响应采用流式输出，消息生成过程可实时感知。
- **会话历史持久化**: 基于 Drizzle ORM + PostgreSQL 存储会话、消息与 Provider 数据。
- **现代前端架构**: 使用 Next.js App Router、React 19、Zustand、Tailwind CSS 4 构建。
- **Markdown 渲染优化**: 支持 AI 回复 Markdown 展示，并针对流式状态做了光标反馈处理。
- **可扩展 Provider 设计**: 通过统一接口和工厂模式封装不同 AI 服务商，便于后续扩容。

## 技术栈

- **应用框架**: Next.js 16 + React 19
- **样式系统**: Tailwind CSS 4
- **状态管理**: Zustand
- **数据库**: PostgreSQL
- **ORM**: Drizzle ORM + Drizzle Kit
- **AI 能力**:
  - Google Generative AI（Gemini）
  - OpenAI Compatible API（DeepSeek）
  - Vercel AI SDK
- **内容渲染**: MarkdownIt
- **组件能力**: Radix UI Select + Iconify
- **数据校验**: Zod

## 项目结构

```text
vchat/
├── src/
│   ├── ai/                         # AI Provider 抽象与实现
│   │   ├── interface.ts
│   │   ├── provider-factory.ts
│   │   └── providers/
│   │       ├── deepseek.ts
│   │       └── gemini.ts
│   ├── app/                        # Next.js App Router
│   │   ├── api/                    # 聊天、会话、Provider 接口
│   │   │   ├── chat/route.ts
│   │   │   ├── conversations/
│   │   │   └── providers/route.ts
│   │   ├── conversation/[id]/      # 对话详情页
│   │   ├── settings/               # 设置页
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx                # 首页
│   ├── components/
│   │   ├── Attachment/             # 图片上传与预览
│   │   ├── Chat/                   # 聊天 UI 组件
│   │   ├── Provider/               # 模型选择器
│   │   └── Ui/                     # 通用组件
│   ├── config/                     # 本地默认 Provider 配置
│   ├── db/                         # 数据库连接、Schema、Service
│   ├── hooks/                      # 自定义 Hooks
│   ├── lib/                        # API 与响应辅助函数
│   ├── stores/                     # Zustand 状态仓库
│   └── types/                      # TypeScript 类型定义
├── package.json
├── MIGRATION_GUIDE.md
├── CLAUDE.md
└── AGENTS.md
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

在根目录创建 `.env.local`：

```env
# PostgreSQL
DATABASE_URL=postgres://username:password@localhost:5432/vchat

# Google Gemini
GEMINI_API_KEY=your_gemini_api_key

# DeepSeek
DEEPSEEK_API_KEY=your_deepseek_api_key
```

### 3. 初始化数据库

```bash
npm run db:push
```

### 4. 启动开发环境

```bash
npm run dev
```

默认访问地址：

```text
http://localhost:3000
```

### 5. 构建生产版本

```bash
npm run build
npm run start
```

## 使用指南

### 开始对话

1. 进入首页后选择可用模型。
2. 输入文本内容，或附带图片一起提问。
3. 提交后页面会立即插入本地消息与 AI 占位消息。
4. AI 回复通过流式返回逐段渲染到消息列表中。

### 会话管理

- 新消息会自动创建会话，并生成会话标题。
- 历史会话可从侧边栏切换查看。
- 切换旧会话时，会自动加载对应消息历史与所选模型。

### Provider 管理

- 当前项目已接入 `gemini` 与 `deepseek`。
- 当数据库中尚未配置 Provider 时，前端会回退到本地默认 Provider 列表。
- 后续扩展新模型时，只需补充 Provider 实现、注册工厂并配置模型列表。

## 数据设计

当前数据库围绕以下核心实体展开：

- **users**: 用户基础信息
- **providers**: AI 供应商与模型配置
- **conversations**: 会话标题、选中模型、所属用户
- **messages**: 问答消息内容、状态、图片字段

这套结构已经覆盖了聊天应用最核心的数据链路，便于继续往认证、设置、Prompt 模板、文件管理等方向扩展。

## 开发说明

### 常用命令

```bash
npm run dev
npm run build
npm run lint
npm run db:push
npm run db:studio
```

### 当前特性状态

- 已完成基础聊天 UI 与消息流式渲染
- 已完成 Gemini / DeepSeek Provider 接入
- 已完成会话与消息持久化
- 已支持图片字段上传与消息展示链路
- 已具备按用户维度读取会话的接口基础

## 安全与注意事项

- API Key 通过环境变量管理，不应提交到仓库。
- 项目当前依赖 `DATABASE_URL` 连接 PostgreSQL，启动前需要确保数据库可用。
- 聊天接口默认会基于请求头 `x-user-id` 识别用户；本地开发场景下存在默认测试用户兜底逻辑。
- 如果只配置了部分 Provider，对应未配置 API Key 的模型将不可用。

## 后续可拓展方向

- 完善用户认证与注册登录流程
- 增加更多模型供应商与模型参数控制
- 支持多轮上下文裁剪与系统提示词配置
- 增加消息重试、会话重命名、消息删除等交互
- 补充单元测试、接口测试与部署方案

## 开源协议

MIT License

## 参与贡献

欢迎提交 Issue 与 Pull Request，一起把 VChat 打磨成更完整的多模态 AI 聊天应用。
