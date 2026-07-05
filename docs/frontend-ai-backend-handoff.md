# 前端 AI / 后端对接说明

本文档用于后续开发后端和 AI 能力时对接当前已完成的前端组件。

## 前端已完成

### 1. AI 角色化入口

位置：`src/components/Chat/RoleRadialMenu.tsx`

聊天输入框左侧新增了圆形 `AI 角色` 按钮。点击后展开 4 个角色按钮：

- 饮食：`templateId = role-food`
- 出行：`templateId = role-travel`
- 情绪：`templateId = role-emotion`
- 学习：`templateId = role-study`

每个角色包含：

- 展示图标、标题、说明、示例文案
- 对应 `systemPrompt`
- 默认生成参数：`temperature`、`topP`、`maxTokens`

点击某个角色后，前端会调用 `useChatStore().updatePromptSettings()`，把该角色的 `templateId`、`systemPrompt` 和默认参数写入全局聊天状态。下一次发送消息时会随 `/api/chat` 请求一起传给后端。

### 2. 专业模式

位置：`src/components/Prompt/ProfessionalModePanel.tsx`

聊天工具栏里有 `专业模式` 按钮。点击后弹出黑色设置面板，包含两个 Tab：

- 生成参数
- 记忆设置

生成参数当前支持：

- `temperature`：温度，范围 0-2
- `topP`：核采样，范围 0-1
- `maxTokens`：最大生成长度
- `systemPrompt`：系统提示词

记忆设置当前支持：

- `memoryEnabled`：长期记忆开关
- `summaryEnabled`：会话摘要开关
- `relevantHistoryEnabled`：相关历史开关
- `recentTurns`：最近对话轮数，目前前端选项为 4、8、12

这些设置也会写入 `chatStore`，发送消息时一起传给 `/api/chat`。

### 3. 消息发送数据流

位置：`src/stores/chatStore.ts`

发送消息时，前端会构造 `SendMessagePayload`：

```ts
{
  conversationId?: number;
  content: string;
  image?: string;
  model: string;
  providerName?: string;
  contextOptions?: {
    memoryEnabled?: boolean;
    summaryEnabled?: boolean;
    relevantHistoryEnabled?: boolean;
    recentTurns?: number;
  };
  promptSettings?: {
    templateId?: string;
    systemPrompt?: string;
    temperature?: number;
    topP?: number;
    maxTokens?: number;
  };
}
```

对应 Zod schema 在：

- `src/types/api.ts`
- `src/lib/validators.ts`

## 后端 / AI 需要对接

### 1. `/api/chat` 需要完整消费前端参数

后端接收 `/api/chat` 请求时，需要继续使用 `sendMessageSchema` 校验请求体。

重点字段：

- `promptSettings.templateId`：当前角色 ID
- `promptSettings.systemPrompt`：前端传来的系统提示词，优先级应高于后端模板默认值
- `promptSettings.temperature`：传给模型调用参数
- `promptSettings.topP`：传给模型调用参数
- `promptSettings.maxTokens`：传给模型调用参数
- `contextOptions.memoryEnabled`：是否启用长期记忆
- `contextOptions.summaryEnabled`：是否启用摘要上下文
- `contextOptions.relevantHistoryEnabled`：是否检索相关历史
- `contextOptions.recentTurns`：拼接最近 N 轮上下文

### 2. AI 调用层建议

构造模型请求时建议顺序：

1. 读取 `promptSettings.systemPrompt`。
2. 如果没有传 `systemPrompt`，再根据 `templateId` 从后端模板表或配置里取默认系统提示词。
3. 根据 `contextOptions` 拼接上下文。
4. 调用模型时传入 `temperature`、`topP`、`maxTokens`。
5. 返回 SSE 流给前端。

建议系统提示词优先级：

```text
前端 promptSettings.systemPrompt
> 后端 templateId 对应模板
> 后端默认通用 system prompt
```

### 3. SSE 返回事件约定

前端当前消费的事件类型：

- `metadata`
- `delta`
- `done`
- `error`

`metadata` 需要返回：

```ts
{
  type: 'metadata';
  conversationId: number;
  conversationTitle: string;
  userMessageId: number;
  aiMessageId: number;
}
```

`delta` 需要返回：

```ts
{
  type: 'delta';
  content: string;
}
```

`done`：

```ts
{
  type: 'done';
}
```

`error`：

```ts
{
  type: 'error';
  message: string;
}
```

### 4. 建议持久化内容

如果后端要支持会话恢复和角色复现，建议在会话或消息维度保存：

- `selectedModel`
- `providerName`
- `templateId`
- `systemPrompt`
- `temperature`
- `topP`
- `maxTokens`
- `contextOptions`

最低成本做法：先只在本次 `/api/chat` 请求内消费这些参数，不立即落库。

更完整做法：把 `promptSettings` 和 `contextOptions` 存到 conversation metadata 或独立设置表中，切换会话时再回填前端。

## 当前前端对接完成标准

后端完成后，前端应该能看到：

- 点击角色后，下一条 AI 回复按该角色风格回答。
- 专业模式里修改温度、Top P、最大 Token 后，实际模型调用参数变化。
- 关闭长期记忆 / 摘要 / 相关历史后，请求上下文随之减少。
- 修改最近轮数后，后端拼接上下文数量变化。
- 新建会话仍能通过 `metadata` 把临时会话 ID 替换成真实会话 ID。

## 后续可做优化

- 把 4 个角色模板从前端常量迁移到后端配置接口，前端只负责渲染。
- 增加角色模板管理接口，允许用户自定义角色。
- 把 `promptSettings`、`contextOptions` 做成会话级配置，切换会话时恢复。
- 给 `/api/chat` 增加更细的错误码，前端可以展示更友好的错误状态。
