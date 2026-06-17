# Task Plan: Add / Improve Login Page

## Goal

Add a polished login page for the current VChat Next.js app by improving the existing `/auth` route, reusing the existing authentication APIs, and preserving the Next.js 16 Proxy-based route protection.

## Current Status

- [x] Inspect project structure and existing auth implementation.
- [x] Read relevant local Next.js 16 docs before planning.
- [x] Identify existing login/register API and Proxy behavior.
- [x] Decide final login page scope and UX.
- [x] Implement login page UI and client behavior.
- [x] Adjust layout behavior so `/auth` does not inherit the authenticated app shell.
- [x] Verify auth flows and build/lint health.

## Proposed Scope For Approval

Build a real application auth entry page at `/auth`, not a marketing landing page. The page will present a polished login-first experience with an inline register mode, reuse `POST /api/auth/login` and `POST /api/auth/register`, and keep the authenticated chat app at `/` behind the existing `src/proxy.ts` protection.

The visual direction should match the product: dark, quiet, precise, app-like. The page should feel like the front door to VChat, with a compact auth form, status/error feedback, and a responsive companion panel that previews practical app affordances rather than selling features.

## Files To Modify After Approval

- Modify `src/app/layout.tsx`
  - Keep only the root HTML/body shell, metadata, global CSS, and `{children}`.
  - Remove global `Sidebar` and `RootLayoutInitializer` from the root layout.
- Create `src/app/(app)/layout.tsx`
  - Add the authenticated app shell: `RootLayoutInitializer`, `Sidebar`, and scrollable `<main>`.
- Move `src/app/page.tsx` to `src/app/(app)/page.tsx`
  - Preserve route URL `/`.
- Move `src/app/settings/page.tsx` to `src/app/(app)/settings/page.tsx`
  - Preserve route URL `/settings`.
- Move `src/app/conversation/[id]/page.tsx` to `src/app/(app)/conversation/[id]/page.tsx`
  - Preserve route URL `/conversation/[id]`.
- Modify `src/app/auth/page.tsx`
  - Replace the currently invalid auth page with a valid client component.
  - Use real `<form onSubmit>` handling.
  - Add login/register mode switching, validation, loading state, success/error messages, and router redirect/refresh after login.
- Usually no change to `src/proxy.ts`
  - Keep as-is unless verification reveals a route-group side effect, which is not expected because route groups do not change URLs.

## Files Not Planned For This Task

- Do not change auth API route contracts unless a compile-time issue forces it.
- Do not refactor existing Chat components.
- Do not fix Chinese mojibake, Chinese comments, comment encoding, or copy encoding unless it directly blocks compile/runtime behavior.
- New user-facing copy for this task should use normal Chinese string literals, not ASCII English and not `\uXXXX` / `\xXX` escape sequences.
- Do not alter database schema, token generation, or cookie names.

## Implementation Plan

### Phase 1: Confirm Existing Auth Contract

- Reuse `POST /api/auth/login` for login.
- Reuse `POST /api/auth/register` only if the page should keep registration in the same view.
- Keep cookie handling server-side through the existing route handler.
- Preserve `/auth` as a public route in `src/proxy.ts`.
- Keep redirect behavior: authenticated users visiting `/auth` should be redirected to `/`.

### Phase 2: Fix Login Page Foundation

- Ensure `src/app/auth/page.tsx` is syntactically valid, especially the currently broken register username input placeholder.
- Convert click-only submit behavior to a real `<form onSubmit>` flow.
- Add basic client-side validation:
  - email required and email-shaped
  - password required
  - username required only in register mode
- Keep API response parsing defensive because current API helpers may return either empty or JSON response bodies.

### Phase 3: Improve User Experience

- Use a focused auth layout with no app sidebar.
- Provide clear login/register mode switching.
- Show loading, success, and error states without layout shift.
- Disable form controls while submitting.
- Use accessible labels or visually clear input names.
- On successful login, navigate to `/` and refresh router state.
- On successful registration, switch back to login mode with a success message.
- Keep the interface useful on first render:
  - desktop: two-column app entry, form plus compact VChat preview/status panel
  - mobile: single-column form-first layout
  - no oversized hero, no decorative marketing sections

### Phase 4: Layout Strategy

- Current `src/app/layout.tsx` always renders `Sidebar`, so `/auth` inherits the logged-in app shell.
- Preferred implementation:
  - Move authenticated routes into a route group such as `src/app/(app)/`.
  - Move `/`, `/settings`, and `/conversation/[id]` into that group.
  - Add `src/app/(app)/layout.tsx` with `RootLayoutInitializer`, `Sidebar`, and `<main>`.
  - Keep root `src/app/layout.tsx` minimal with only `<html>`, `<body>`, globals, and children.
  - Keep `src/app/auth/page.tsx` outside the app shell.
- Lower-risk alternative:
  - Add `src/app/auth/layout.tsx` if sufficient, but it cannot remove UI already rendered by the root layout. Therefore route grouping is the cleaner solution.

### Phase 5: Verification

- Run `npm.cmd run lint`.
- Run `npm.cmd run build`.
- Manually verify:
  - unauthenticated `/` redirects to `/auth`
  - `/auth` renders without sidebar
  - login with invalid credentials shows an error
  - login with valid credentials redirects to `/`
  - authenticated `/auth` redirects to `/`
  - register mode validates username/email/password and returns to login after success

## Risks

- Route-group file moves can affect imports only if relative imports are used; current app files mostly use `@/` aliases, so risk is moderate-low.
- Auth route currently uses HTTP-only cookies, so the client cannot directly inspect login state and should rely on redirects.
- The project contains mojibake comments/text in multiple files. Per user preference, do not fix mojibake or Chinese comments unless they directly block compile/runtime behavior.
- The worktree already has unrelated modified/untracked UI files. Implementation must avoid overwriting them.

## Approval Gate

Wait for explicit user approval before editing application files. After approval, use the requested execution workflow and run:

- `npm run lint`
- `npm run build`

## Implementation Result

- Implemented `/auth` as a real app entry page with login/register modes, form submit handling, client validation, loading state, and success/error feedback.
- Moved authenticated application routes under `src/app/(app)/` so `/auth` no longer inherits the app sidebar.
- Kept `src/proxy.ts` unchanged; route groups preserve the existing URLs.
- Added project preference to `AGENTS.md`: ignore existing Chinese mojibake/comments unless they block compile/runtime behavior, while new user-facing copy should be normal Chinese.

## Verification Result

- `npm run lint` was blocked by PowerShell execution policy for `npm.ps1`.
- `npm.cmd run lint` completed with 0 errors and 2 warnings:
  - `src/components/Attachment/ImagePreview.tsx`: existing `<img>` warning.
  - `src/components/Chat/MessageBubble.tsx`: existing `<img>` warning.
- `npm.cmd run build` completed successfully with Next.js 16.2.4.

---

# Task Plan: Secure Markdown HTML Rendering

## Goal

Ensure AI Markdown content is parsed first and then sanitized before any HTML is rendered, so scripts, event attributes, dangerous protocols, and unsafe tags/attributes are blocked while safe Markdown formatting continues to work.

## Current Status

- [x] Inspect current project structure, key files, existing components, styles, APIs, and config.
- [x] Read relevant local Next.js 16 docs before planning.
- [x] Locate current Markdown rendering path.
- [x] Record findings and implementation plan.
- [ ] Get approval for the implementation design.
- [ ] Add sanitizer dependency if needed.
- [ ] Add focused safety checks for Markdown sanitization behavior.
- [ ] Implement sanitized Markdown rendering.
- [ ] Run lint/build and available tests.

## Current Understanding

- The project is a Next.js 16.2.4 App Router app with React 19.
- Markdown rendering is isolated in `src/components/Ui/MarkdownBlock.tsx`.
- The component currently uses `markdown-it` with `html: true`, `breaks: true`, and `linkify: true`.
- After `markdownParser.render(...)`, the HTML is passed directly to `dangerouslySetInnerHTML`.
- Table styling is injected through `src/components/Ui/Table.tsx` by adding classes to markdown-it renderer rules.
- The rendered Markdown is used by `src/components/Chat/MessageBubble.tsx` for assistant responses.
- `dompurify` is not currently installed.

## Proposed Scope For Approval

Keep the existing user-visible Markdown behavior, but insert a strict sanitize step between Markdown parsing and `dangerouslySetInnerHTML`.

The preferred approach is:

- Add `dompurify` as a dependency.
- Keep `MarkdownBlock` as a Client Component, matching Next.js local docs for browser/third-party-library usage.
- Configure DOMPurify with explicit allowed tags and attributes.
- Forbid script-capable and form/embed tags.
- Forbid all event attributes.
- Restrict URL attributes to safe protocols such as `http`, `https`, `mailto`, and `tel`.
- Preserve project table wrapper/classes and the streaming cursor by sanitizing after the cursor is appended, with only safe `span`/`class` output allowed.

## Files To Modify After Approval

- `package.json`
  - Add sanitizer dependency.
- `package-lock.json`
  - Update lockfile through npm.
- `src/components/Ui/MarkdownBlock.tsx`
  - Import sanitizer.
  - Add allowlist configuration.
  - Sanitize the rendered HTML before returning it.
  - Keep existing Markdown parser and table styling unless verification reveals a conflict.
- Optional focused test/check file
  - Add a small script or test if the current project setup supports it without broad tooling churn.

## Implementation Plan

### Phase 1: Dependency And Test Harness

- Install `dompurify`.
- Prefer a small focused automated check for sanitizer behavior.
- If no suitable test runner exists, use a lightweight verification command or document the limitation.

### Phase 2: Sanitizer Configuration

- Define a local allowlist for Markdown output:
  - text structure: `p`, headings, lists, `blockquote`, `hr`, `br`
  - emphasis/code: `strong`, `em`, `s`, `code`, `pre`
  - links: `a` with safe `href`, `title`, `target`, `rel`
  - tables: `div`, `table`, `thead`, `tbody`, `tr`, `th`, `td`
  - streaming cursor: `span`
- Allow `class` only because existing Tailwind/prose/table/cursor styling depends on it.
- Block dangerous tags including `script`, `style`, `iframe`, `object`, `embed`, `form`, `input`, `button`, `textarea`, `select`, `svg`, `math`, and media tags unless explicitly needed later.
- Block event attributes such as `onclick`.
- Block dangerous protocols such as `javascript:`, `data:`, and `vbscript:`.

### Phase 3: MarkdownBlock Integration

- Render Markdown with `markdown-it`.
- Append streaming cursor HTML when needed.
- Sanitize the final HTML.
- Pass only sanitized output to `dangerouslySetInnerHTML`.

### Phase 4: Verification

- Run focused sanitizer checks if added.
- Run `npm.cmd run lint`.
- Run `npm.cmd run build`.

## Risks

- Sanitizing after render may strip a tag or attribute currently relied on by Markdown/table styling; allowlist should include current table wrapper and class usage.
- Allowing `class` is necessary for styling but broad; risk is acceptable only because scripts/events/protocols are still blocked and this app does not use untrusted class names for behavior.
- Installing `dompurify` may require network access; if npm install is blocked, retry with escalation.
- There is no existing `npm test` script, so verification may rely on focused commands plus lint/build unless a minimal test script is introduced.

## Approval Gate

Wait for explicit user approval before editing application code or package dependencies.

---

# Task Plan: Standardize AI SSE Stream Protocol With Metadata

## Goal

Extend the current SSE conversion into a stable front/back AI stream protocol. The backend should emit standard `text/event-stream` events for `metadata`, `delta`, `done`, and `error`. The frontend should consume those events as the single source of truth for conversation ID backfill, title updates, message IDs, message status, errors, stop generation behavior, and persisted message state.

## Current Status

- [x] Re-read requested skills: `using-superpowers`, `planning-with-files`, and `brainstorming`.
- [x] Confirm `context-engineering` is not installed; use explicit project-context inspection instead.
- [x] Re-read existing planning files and current uncommitted SSE work.
- [x] Re-read local Next.js 16 Route Handler and Streaming docs.
- [x] Inspect current stream files and identify remaining protocol gaps.
- [x] Update `findings.md` and `progress.md`.
- [ ] Wait for explicit user approval.
- [ ] Implement unified stream event types and metadata event.
- [ ] Update backend stream event ordering.
- [ ] Update frontend store/client to use metadata event instead of response headers.
- [ ] Run focused SSE protocol checks, lint, and build.

## Current Understanding

- The previous implementation already moved the wire format from NDJSON to SSE:
  - `src/lib/sse-stream.ts`
  - `src/lib/api-error.ts`
  - `src/stores/chatStore.ts`
  - `src/lib/api-client.ts`
  - `scripts/check-sse-stream.ts`
- The remaining gap is protocol design, not transport:
  - metadata still comes from response headers
  - stream event types are duplicated in multiple files
  - no first-class `metadata` event exists
  - `chatStore.ts` still contains a stale NDJSON comment block
- Native `EventSource` remains a poor fit because this endpoint needs POST JSON body, images, auth, and AbortController cancellation. The protocol should remain `fetch + ReadableStream` consuming `text/event-stream`.

## Proposed Protocol

Use one shared event union:

- `metadata`: sent first after the server has created or found the conversation and persisted both the user message and AI placeholder. Payload includes `conversationId`, `conversationTitle`, `userMessageId`, and `aiMessageId`.
- `delta`: payload includes `content`; appends generated model text.
- `done`: payload includes final `content`; marks the AI answer as `finished` after persistence succeeds.
- `error`: payload includes `message` and optional partial `content`; marks the AI answer as `error`, preserving any partial text already streamed.

## Files To Modify After Approval

- `src/lib/sse-stream.ts`
  - Export shared chat stream event types.
  - Keep generic SSE encode/parse utilities.
  - Add type guard or validation helper if useful for frontend safety.
- `src/lib/api-error.ts`
  - Keep stream response headers.
  - Ensure error stream can emit typed `error` events.
- `src/app/api/chat/route.ts`
  - Include `metadata` in `ChatStreamEvent`.
  - Enqueue `metadata` as the first stream event after DB records are ready.
  - Stop sending conversation/message IDs through custom response headers unless retained temporarily for compatibility.
  - Keep persistence order: create conversation/messages before metadata; update AI message before `done`.
- `src/stores/chatStore.ts`
  - Use shared event type.
  - Remove response-header parsing for conversation ID/title/message IDs.
  - On `metadata`, resolve optimistic conversation and update local message IDs if useful.
  - Keep `delta`, `done`, `error`, and AbortError behavior.
  - Remove stale NDJSON comment block.
- `src/lib/api-client.ts`
  - Use shared event type and safely ignore metadata unless a callback is needed.
- `scripts/check-sse-stream.ts`
  - Extend checks to cover `metadata` frames and event ordering assumptions.

## Implementation Plan

### Phase 1: Protocol Contract

- Define shared `ChatStreamEvent` and related event interfaces.
- Add focused checks for encoding/parsing `metadata`, `delta`, `done`, and `error`.
- Verify the new checks fail before production changes if the contract is not yet implemented.

### Phase 2: Backend Event Ordering

- Keep all existing validation before stream creation.
- Persist conversation, user message, and AI placeholder.
- Start stream with `metadata`, then zero or more `delta`, then `done` or `error`.
- Keep memory save and summarization as background follow-up after stream close, matching current behavior.

### Phase 3: Frontend Event Handling

- Move conversation ID backfill from response headers to the `metadata` event.
- For new optimistic conversations, call `assignNewConversationId` when metadata arrives.
- Optionally replace local optimistic message IDs with server IDs to make future retry/error flows more reliable.
- Continue appending chunks to the current active answer placeholder.
- Preserve stop generation behavior: client abort marks current answer as `finished`; server-side provider cancellation is out of scope unless explicitly requested.

### Phase 4: Secondary Client Alignment

- Update `sendMessageStream` to use shared event type.
- Keep its public return as full generated text.

### Phase 5: Verification

- Run `npm.cmd run check:sse-stream`.
- Run `npm.cmd run lint`.
- Run `npm.cmd run build`.

## Risks

- If metadata is delayed until after generation starts, new conversation ID backfill would be late; metadata should be first.
- Replacing optimistic local message IDs with DB IDs can affect active answer tracking; if implemented, active IDs must be updated carefully.
- Removing response-header fallback may break any hidden consumer that relies on those headers. Search currently points to the store as the main consumer.
- Stop generation with client abort does not automatically cancel provider execution server-side unless the request signal is threaded through provider calls; this task will preserve current behavior unless explicitly expanded.

## Approval Gate

Wait for the user to reply `计划通过，开始实现` before editing application code for this expanded protocol.

---

# Task Plan: Convert Chat Stream From NDJSON To SSE

## Goal

将当前聊天信息流从 `fetch + ReadableStream + NDJSON` 改为 `fetch + ReadableStream + SSE(text/event-stream)` 的处理方式，保留现有的 POST 请求体、鉴权、会话创建、停止生成、错误兜底和消息实时追加体验。

## Current Status

- [x] 加载并阅读 `using-superpowers` 与 `planning-with-files`。
- [x] 确认当前没有可用的 `context-engineering` skill；用项目上下文梳理替代。
- [x] 阅读项目结构、关键组件、API、store、样式入口和配置。
- [x] 阅读本地 Next.js 16 Route Handlers、Streaming、Fetching Data 文档。
- [x] 定位当前 NDJSON 流式前后端链路。
- [x] 写入本次发现和实现计划。
- [ ] 等待用户确认计划。
- [ ] 实现 SSE 编码、响应头和前端解析。
- [ ] 运行 lint/build 和必要的流解析检查。

## Current Understanding

- 项目是 Next.js 16.2.4 App Router 应用，聊天接口位于 `src/app/api/chat/route.ts`，运行时为 `nodejs`。
- 当前后端通过 `ReadableStream<Uint8Array>` 输出每行 JSON，即 NDJSON。
- 当前响应工具在 `src/lib/api-error.ts` 中，`streamResponse` 使用 `Content-Type: application/x-ndjson; charset=utf-8`。
- 当前前端主链路在 `src/stores/chatStore.ts`：
  - `sendMessage` 使用 `fetch('/api/chat', { method: 'POST' })`。
  - 读取 `response.body.getReader()`。
  - 用 `TextDecoder` 按 `\n` 切行。
  - `parseStreamLine` 直接 `JSON.parse(line)`。
  - 事件类型为 `delta`、`done`、`error`。
- `src/lib/api-client.ts` 里也有一个 `sendMessageStream`，但搜索结果显示主 UI 没有引用它；它目前只是把原始 chunk 当文本拼接，可能是旧工具或备用客户端。
- `MessageList.tsx` 只负责渲染和滚动，不参与流协议。

## Recommended Approach

推荐保持 POST + fetch + ReadableStream，不改成浏览器原生 `EventSource`。

原因：

- 现有 `/api/chat` 需要 POST JSON body，包含 content、image、model、providerName、contextOptions、promptSettings；原生 `EventSource` 只支持 GET，若使用它会迫使协议拆成“先 POST 创建任务，再 GET 订阅事件”，改动面更大。
- fetch 读取 `text/event-stream` 是常见且适合聊天生成的方式，可以继续复用 AbortController、请求体、响应头中的 conversation/message id，以及现有乐观 UI。
- 对用户目标来说，核心是把“流格式”从 NDJSON 改成 SSE，而不是替换整个请求模型。

## Files To Modify After Approval

- `src/lib/api-error.ts`
  - 新增或替换流编码工具，把事件编码为 SSE frame：
    - `event: delta`
    - `data: {...}`
    - 空行结束一帧
  - 将流响应头改为 `Content-Type: text/event-stream; charset=utf-8`。
  - 保留 `Cache-Control: no-cache, no-transform`、`Connection: keep-alive`。
  - 增加 `X-Accel-Buffering: no`，降低反向代理缓冲风险。
- `src/app/api/chat/route.ts`
  - 使用 SSE 编码函数输出 `delta`、`done`、`error`。
  - 保持业务事件结构不变，尽量不碰 AI/provider/db 逻辑。
- `src/stores/chatStore.ts`
  - 将 `parseStreamLine` 替换为 SSE frame 解析。
  - 前端继续使用 fetch reader，按空行 `\n\n` 分帧，而不是按单行 JSON 解析。
  - 解析 `event:` 和多行 `data:`，得到现有 `ChatStreamEvent`。
  - 兼容 `\r\n`。
  - 保持 AbortController、乐观会话转正、消息追加和错误状态逻辑不变。
- `src/lib/api-client.ts`
  - 若保留该客户端，更新 `sendMessageStream` 为 SSE 解析，避免旧工具未来误用时仍按原始 chunk/NDJSON 行处理。

## Implementation Plan

### Phase 1: SSE Protocol Helpers

- 在 `src/lib/api-error.ts` 中实现小而明确的 SSE 编码函数。
- `data` 使用 `JSON.stringify(event)`，并为多行 data 做安全拆分，每行前缀 `data: `。
- 每个事件以空行结束，确保客户端可以稳定分帧。
- 将错误流也改为 SSE。

### Phase 2: Backend Integration

- 在 `src/app/api/chat/route.ts` 中替换 `encodeStreamEvent` 调用为 SSE 编码。
- 保持响应自定义 header：
  - `x-conversation-id`
  - `x-conversation-title`
  - `x-user-message-id`
  - `x-ai-message-id`
- 保持流开始前的校验逻辑，因为 Next 文档确认流开始后不能再改 HTTP 状态或 headers。

### Phase 3: Frontend SSE Parser

- 在 `src/stores/chatStore.ts` 增加本地 SSE 解析函数：
  - 输入完整 frame 字符串。
  - 忽略注释行 `:`。
  - 支持 `event:`。
  - 合并一个 frame 内多个 `data:` 行。
  - 没有 data 时返回 `null`。
  - JSON parse 失败返回 `null` 或 error event，不让坏帧打断整个 UI。
- reader 循环改为按空行分帧，流结束时处理尾帧。
- `handleStreamEvent` 复用现有 `delta/done/error` 分支。

### Phase 4: Legacy Client Alignment

- 检查 `src/lib/api-client.ts` 是否确实未被 UI 使用。
- 若保留，更新为 SSE 解析并继续对外返回完整文本。
- 不引入新依赖。

### Phase 5: Verification

- 运行 `npm.cmd run lint`。
- 运行 `npm.cmd run build`。
- 如时间允许，加一个轻量脚本或用现有 `tsx` 快速验证 SSE parser 对以下情况正常：
  - 单帧 `delta`
  - 多帧连续 chunk
  - CRLF
  - chunk 被截断后拼回
  - `error` frame

## Risks

- SSE 分帧以空行结束，如果编码遗漏空行，前端会一直缓存不更新。
- 浏览器原生 `EventSource` 不适合当前 POST 请求形态，所以本计划使用 fetch 读取 SSE；如果用户明确要求必须用 `EventSource`，需要改成两阶段协议。
- 中间代理或压缩层可能缓冲流；计划通过 `no-cache/no-transform` 和 `X-Accel-Buffering: no` 降低风险，但部署环境仍可能需要单独配置。
- `src/lib/api-client.ts` 当前像是备用客户端，若外部未使用，验证主要覆盖 store 主链路。

## Approval Gate

等待用户明确回复“计划通过，开始实现”后再修改业务代码。
---

# Task Plan: Backend Cancellation And Chat Stream Protocol Layer

## Goal

把“停止生成”从前端 fetch abort 继续传到后端 provider，让上游模型请求真正取消；同时把 SSE 消费逻辑从 Zustand `chatStore.ts` 抽成独立协议层，后续增加工具调用、token usage、上下文引用、模型切换元信息等事件时，不再把 store 撑大。

## Current Status

- [x] 加载并阅读 `using-superpowers`、`planning-with-files`、`brainstorming`。
- [x] 确认当前没有安装 `context-engineering` skill；改用显式项目上下文梳理。
- [x] 重新阅读项目结构、当前规划文件、Next.js 本地 Route Handler / Streaming 文档。
- [x] 重新分析当前 SSE 实现、前端 store 消费链路、后端 route 流输出链路、provider 接口和 OpenAI SDK abort 支持。
- [x] 更新 `task_plan.md`、`findings.md`、`progress.md`。
- [x] 等待用户确认计划。
- [x] 先补充/调整 focused SSE consumer 检查。
- [x] 实现 provider abort signal 传递。
- [x] 抽出前端 SSE/chat stream consumer 协议层。
- [x] 收敛 `chatStore.ts` 和 `api-client.ts` 调用新协议层。
- [x] 运行 `npm.cmd run check:sse-stream`、`npm.cmd run lint`、`npm.cmd run build`。

## Current Understanding

- 当前项目已经从 NDJSON 升级到了 `fetch + ReadableStream + text/event-stream`。
- `src/app/api/chat/route.ts` 已经按顺序发送 `metadata`、多个 `delta`、最终 `done` 或 `error`。
- `src/lib/sse-stream.ts` 已经包含 SSE encode/parse、`ChatStreamEvent` 联合类型和 `isChatStreamEvent`。
- `src/stores/chatStore.ts` 仍然直接负责 `response.body.getReader()`、`TextDecoder`、`createSseParser`、`isChatStreamEvent`、tail flush 和事件分发。
- `src/lib/api-client.ts` 也有一份相似的 SSE reader loop。
- `stopGeneration` 目前只 abort 前端 fetch，并在 catch 中把当前 AI 消息标记为 `finished`。
- 后端 `provider.streamChat(...)` 目前没有接收 `AbortSignal`，所以取消没有明确传到 OpenAI-compatible provider。
- 当前 provider 只有一个核心实现：`OpenAICompatibleProvider`；DeepSeek 和 Qwen 都继承它。
- 当前 `openai` SDK 的 `chat.completions.create(body, options)` 支持 `RequestOptions.signal?: AbortSignal`，可以把 `request.signal` 传给上游请求。
- `summarizeMessages` 也调用 `provider.streamChat(prompt, modelName)`；修改接口时要保持可选参数兼容，不影响摘要任务。

## Proposed Design

### 1. Provider Cancellation

扩展 `AIProvider.streamChat` 的最后一个可选参数为 options 对象：

- `options?: { signal?: AbortSignal }`

这样比继续添加位置参数更清晰，也不会破坏现有调用，因为它在末尾可选。

在 `OpenAICompatibleProvider.streamChat` 中：

- 调用 `this.client.chat.completions.create(..., { signal: options?.signal })`。
- 在拿到流之前、遍历每个 chunk 前后检查 `signal.aborted`。
- abort 时停止继续调用 `onChunk`。

在 `src/app/api/chat/route.ts` 中：

- 把 `request.signal` 传给 provider。
- 监听/检查 abort，避免连接断开后继续 `controller.enqueue`。
- 用户主动停止时不发送 `error` 事件，保留当前 UX：前端 partial answer 标记为 `finished`。
- 后端把已生成的 partial 内容持久化为 `finished`，并 touch conversation。

### 2. Chat Stream Consumer Protocol Layer

新增独立协议消费层，建议文件：

- `src/lib/chat-stream-client.ts`

职责：

- 接收 `Response` 或 `ReadableStream<Uint8Array>`。
- 内部统一处理 reader、TextDecoder、SSE parser、flush、事件校验。
- 对外暴露 callback API，例如 `onMetadata`、`onDelta`、`onDone`、`onError`、`onEvent`、`onInvalidEvent`。
- `error` 事件是否 throw 由调用方或参数决定，便于 store 和备用 API client 复用同一消费逻辑。

`chatStore.ts` 保留状态职责：发起 fetch、创建 optimistic conversation/messages，并在 callbacks 中更新 Zustand 状态；不再直接处理 reader/parser/decoder/flush。

`api-client.ts` 复用同一 consumer：累积 `delta` 文本，收到 `error` 事件时抛错，忽略或透传 `metadata`。

## Files To Modify After Approval

- `src/ai/interface.ts`
- `src/ai/providers/openai-compatible.ts`
- `src/app/api/chat/route.ts`
- `src/lib/chat-stream-client.ts`
- `src/stores/chatStore.ts`
- `src/lib/api-client.ts`
- `scripts/check-sse-stream.ts`

## Implementation Plan

### Phase 1: Focused Checks

- 扩展 `check:sse-stream`，覆盖新 consumer：
  - metadata/delta/done 顺序消费。
  - chunk 被截断后可恢复。
  - flush tail。
  - invalid frame 不打断主流程。
  - error event 能回调或抛错。

### Phase 2: Provider Abort Signal

- 扩展 `AIProvider.streamChat` 末尾 options。
- `OpenAICompatibleProvider` 传递 `{ signal }` 给 SDK。
- 后端 route 传入 `request.signal`。
- abort 时避免写 error event，持久化 partial content 为 `finished`。

### Phase 3: Extract Consumer Layer

- 新建 `src/lib/chat-stream-client.ts`。
- 把 reader/decoder/parser/flush/event guard 迁移进去。
- 设计为纯协议层，不 import Zustand，不处理 UI 状态。

### Phase 4: Store And API Client Integration

- `chatStore.ts` 只保留 fetch 和状态 callback。
- `api-client.ts` 复用 consumer，避免重复 reader loop。
- 保持现有 metadata 回填、标题更新、消息 ID 替换、delta 追加、done/error 行为不变。

### Phase 5: Verification

- `npm.cmd run check:sse-stream`
- `npm.cmd run lint`
- `npm.cmd run build`

## Risks

- 请求 abort 后 `ReadableStreamDefaultController.enqueue` 可能抛错；route 里需要 closed/aborted guard。
- abort 与 provider 抛出的 AbortError 在不同运行时名字可能不同；应同时检查 `request.signal.aborted` 和错误名称。
- 如果把 abort 后 partial 内容标记为 `finished`，历史记录会保留半截回答；这与当前前端 UX 一致，但语义上是“用户停止”而非自然完成。
- 修改 provider 接口会影响摘要调用；options 必须保持可选。
- `chatStore.ts` 中已有大量中文乱码注释；按项目偏好，只处理本次直接相关的过期 NDJSON 注释，不主动清理其他编码历史。

## Approval Gate

等待用户回复“计划通过，开始实现”后再修改业务代码。

## Implementation Result

- 新增 `src/lib/chat-stream-client.ts`，把 SSE reader、TextDecoder、parser、flush、事件校验和 callback 分发从 store 中抽出。
- `src/stores/chatStore.ts` 改为调用 `consumeChatStream`，只保留 metadata/delta/done/error 到 Zustand 状态的映射。
- `src/lib/api-client.ts` 改为复用 `consumeChatStream`，避免维护第二份 reader/parser loop。
- `src/ai/interface.ts` 增加 `AIStreamOptions`，`streamChat` 末尾支持 `{ signal?: AbortSignal }`。
- `src/ai/providers/openai-compatible.ts` 把 signal 传给 OpenAI SDK `chat.completions.create(..., { signal })`，并在流迭代中检查 abort。
- `src/app/api/chat/route.ts` 把 `request.signal` 传给 provider；abort 时把 partial answer 持久化为 `finished`，不发送 error event；普通错误仍发送 SSE `error`。
- `scripts/check-sse-stream.ts` 增加高级 consumer 检查，覆盖 split chunks、invalid event、delta callback 和 error callback。

## Verification Result

- `npm.cmd run check:sse-stream` passed.
- `npm.cmd run lint` passed with 0 errors and 2 existing `<img>` warnings.
- `npm.cmd run build` passed successfully with Next.js 16.2.4.
