# Findings: Backend Cancellation And Chat Stream Protocol Layer

## Project Context

- Project is a Next.js 16.2.4 App Router app.
- Per `AGENTS.md`, local Next docs were re-read before planning:
  - `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
  - `node_modules/next/dist/docs/01-app/02-guides/streaming.md`
- Relevant doc conclusions:
  - Route Handlers use standard Web `Request` and `Response`.
  - Route Handlers can stream raw `ReadableStream` responses.
  - SSE is an appropriate Route Handler streaming use case.
  - Once streaming starts, HTTP status/headers cannot be changed.
  - Proxies/compression may buffer streams; existing `X-Accel-Buffering: no` remains appropriate.

## Current Stream Implementation

- `src/lib/sse-stream.ts` now owns generic SSE encode/parse and shared `ChatStreamEvent` types:
  - `metadata`
  - `delta`
  - `done`
  - `error`
- `src/app/api/chat/route.ts` emits `metadata` first, then `delta`, then `done` or `error`.
- `src/lib/api-error.ts` returns `Content-Type: text/event-stream; charset=utf-8`.
- `src/stores/chatStore.ts` consumes SSE directly with reader/decoder/parser/guard/flush logic.
- `src/lib/api-client.ts` has a second similar SSE reader loop.
- `scripts/check-sse-stream.ts` covers low-level SSE parser behavior, but not a higher-level chat stream consumer yet.

## Stop Generation Gap

- `stopGeneration` currently aborts the frontend `fetch` through `AbortController`.
- The frontend catch block treats `AbortError` as a user stop and marks the active answer `finished`.
- Backend provider calls do not receive `request.signal`.
- `src/ai/interface.ts` defines `streamChat(...)` without any abort/options parameter.
- `src/ai/providers/openai-compatible.ts` calls `this.client.chat.completions.create(...)` without request options.
- DeepSeek and Qwen both inherit `OpenAICompatibleProvider`, so a single provider implementation change covers both.
- The installed `openai` SDK type definitions show `chat.completions.create(body, options?: RequestOptions)` and `RequestOptions.signal?: AbortSignal`, so provider-level cancellation can be wired directly.

## Integration Notes

- `src/ai/context/summarizer.ts` calls `provider.streamChat(prompt, input.modelName)`; provider options must remain optional to preserve this call.
- Abort handling should avoid sending an `error` event for user stop, because current UI treats stop as a successful partial finish.
- Backend should persist partial generated content on stop as `finished`, matching current UX and avoiding a stuck `loading` DB message.
- The stream controller needs a closed/aborted guard because enqueueing after the client disconnects can throw.
- `chatStore.ts` contains old NDJSON wording in a comment block; this is directly related and should be removed or rewritten during extraction.
- Existing Chinese mojibake/comments are otherwise out of scope per project preference.

---

# Findings: Login Page Plan

## Project Facts

- Project uses `next@16.2.4`, React `19.2.4`, and App Router under `src/app`.
- `AGENTS.md` requires reading local Next.js docs in `node_modules/next/dist/docs/` before code changes.
- Relevant local docs confirm:
  - App Router pages are file-system routes under `app`.
  - `page.tsx` makes a route segment public.
  - In Next.js 16, Middleware is now called Proxy.
  - `proxy.ts` belongs at project root or under `src` when using a `src` app folder.

## Existing Auth Surface

- `src/app/auth/page.tsx` already exists and implements login/register mode switching.
- `src/app/api/auth/login/route.ts` exists and:
  - validates `email` and `password`
  - verifies password
  - creates access and refresh tokens
  - sets `access_token` and `refresh_token` HTTP-only cookies
- `src/app/api/auth/register/route.ts` exists and:
  - validates `username`, `email`, and `password`
  - checks username/email uniqueness
  - creates the user
- `src/app/api/auth/refresh/route.ts` and `logout` also exist.
- `src/lib/validators.ts` defines:
  - `loginSchema`: email + password
  - `registerSchema`: username + email + password

## Routing And Protection

- `src/proxy.ts` already protects non-public routes.
- `/auth`, `/_next`, `/favicon`, and `/api/auth` are public.
- Authenticated users hitting `/auth` are redirected to `/`.
- Unauthenticated page requests redirect to `/auth`.
- Unauthenticated API requests outside `/api/auth` return 401 JSON.

## UI/Layout Concerns

- `src/app/layout.tsx` currently renders `RootLayoutInitializer`, `Sidebar`, and `<main>` for every route.
- Because `/auth` is inside the same root layout, the auth page will inherit the app sidebar.
- A route group for authenticated app routes is the cleanest way to keep `/auth` visually separate.

## Existing Issue

- `src/app/auth/page.tsx` contains mojibake text and comments.
- The username input placeholder appears broken in the captured content, so the current page may fail compile or render incorrectly.

## 2026-05-25 Refresh

- Current package versions: `next@16.2.4`, `react@19.2.4`, Tailwind CSS v4 via `@tailwindcss/postcss`.
- Local Next.js 16 docs read before implementation planning:
  - `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`
  - `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route-groups.md`
  - `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`
  - `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`
- Docs confirm:
  - `app/layout.tsx` root layout is required and must contain `html` and `body`.
  - Nested layouts wrap child pages.
  - Route groups such as `(app)` do not affect URL paths and can opt selected routes into a shared layout.
  - `proxy.ts` may live in `src` when the app folder is also under `src`.
  - Next 16 renamed Middleware to Proxy; the named export should be `proxy`.
- Current `src/proxy.ts` already exposes `/auth` and `/api/auth/*` as public and redirects authenticated `/auth` users to `/`.
- Current root layout renders `RootLayoutInitializer`, `Sidebar`, and `<main>` for every route. This makes `/auth` visually depend on app chrome unless the app shell moves into a route group.
- `RootLayoutInitializer` and `Sidebar` both contain path-specific `/auth` exceptions. Moving them into an authenticated app route group lets us remove the need for auth-page layout exceptions later, but the first implementation can leave their defensive checks in place to avoid unrelated churn.
- Existing reusable UI components are limited and dark-app oriented:
  - `Button` is full-width and gray/blue, not suitable as-is for a polished auth form primary/secondary button.
  - `SidebarButton` is sidebar-specific.
  - `FormTag` currently maps unrelated prompt field names.
  The auth page should use Tailwind directly for scoped form controls instead of stretching these components beyond their purpose.
- `src/app/auth/page.tsx` is currently syntactically broken around the username placeholder and contains mojibake UI copy.
- PowerShell note: paths containing `[id]` must be read with `-LiteralPath`, e.g. `src\app\conversation\[id]\page.tsx`.
- Project preference added to `AGENTS.md`: do not proactively fix existing Chinese mojibake/comments/encoding issues unless they block compile/runtime behavior; new user-facing copy should still be normal Chinese.

---

# Findings: Secure Markdown HTML Rendering

## Project Facts

- Project uses `next@16.2.4`, React `19.2.4`, App Router under `src/app`, Tailwind CSS v4, and `markdown-it`.
- Local Next.js 16 docs read before planning:
  - `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`
  - `node_modules/next/dist/docs/01-app/02-guides/third-party-libraries.md`
- Relevant doc conclusions:
  - Components that use browser-only APIs or client-side third-party libraries should be Client Components.
  - A file marked `'use client'` defines a client boundary; imports used by that component are part of the client bundle.
- `src/components/Ui/MarkdownBlock.tsx` is already a Client Component.

## Markdown Rendering Path

- `src/components/Chat/MessageBubble.tsx` dynamically imports `MarkdownBlock`.
- `src/components/Ui/MarkdownBlock.tsx`:
  - creates a shared `MarkdownIt` parser
  - enables `html: true`, `breaks: true`, and `linkify: true`
  - applies table styles through `applyMarkdownTableStyles`
  - renders Markdown to HTML with `markdownParser.render(deferredContent)`
  - appends a streaming cursor HTML span when status is `streaming`
  - sends the final string directly to `dangerouslySetInnerHTML`
- `src/components/Ui/Table.tsx` injects table wrapper and cell classes by overriding markdown-it renderer rules.

## Dependency State

- `markdown-it` and `@types/markdown-it` are installed.
- `dompurify` is not currently installed.
- No existing sanitizer was found via `rg` for `DOMPurify`, `sanitize`, or related terms.

## Security Requirement

- Markdown must be parsed first, then sanitized before HTML insertion.
- Sanitization must use a whitelist approach.
- Scripts, event attributes, and dangerous protocols must be blocked.
- Only safe tags and attributes should remain.

---

# Findings: Convert Chat Stream From NDJSON To SSE

## Project Facts

- Project uses `next@16.2.4`, React `19.2.4`, App Router under `src/app`.
- Current worktree status from `git status --short` only shows untracked `tmp_pdf_text.txt`; no tracked app file modifications were present before this planning update.
- Local Next.js 16 docs read for this task:
  - `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
  - `node_modules/next/dist/docs/01-app/02-guides/streaming.md`
  - `node_modules/next/dist/docs/01-app/01-getting-started/06-fetching-data.md`
- Relevant local doc conclusions:
  - App Router Route Handlers use standard Web `Request` and `Response` APIs.
  - Route Handlers can stream raw responses with `ReadableStream`.
  - Server-Sent Events are explicitly called out as a valid Route Handler streaming use case.
  - Once streaming starts, status code and headers cannot be changed.
  - Streaming can be affected by proxies/CDNs/compression; `X-Accel-Buffering: no` is useful for Nginx-style buffering.

## Current Chat Stream Path

- Backend route: `src/app/api/chat/route.ts`
  - Exports `runtime = 'nodejs'`.
  - Parses POST JSON body.
  - Validates user/model/content/provider before creating the stream.
  - Creates conversation and placeholder AI message before streaming.
  - Streams provider chunks through `ReadableStream<Uint8Array>`.
  - Emits three event types: `delta`, `done`, `error`.
  - Sends conversation/message ids through response headers.
- Shared response utilities: `src/lib/api-error.ts`
  - `encodeStreamEvent(event)` currently writes `${JSON.stringify(event)}\n`.
  - `streamResponse(...)` currently sets `Content-Type: application/x-ndjson; charset=utf-8`.
  - `streamErrorResponse(...)` and `writeStreamError(...)` also use NDJSON encoding.
- Frontend main store: `src/stores/chatStore.ts`
  - `sendMessage` uses `fetch('/api/chat', { method: 'POST' })`.
  - Keeps `AbortController` for Stop generation.
  - Reads `response.body.getReader()`.
  - Uses `TextDecoder` plus a string buffer.
  - Current parsing splits by `\n` and `JSON.parse`s each complete line.
  - UI updates are already protocol-agnostic after parsing: `delta` appends content, `done` finishes, `error` marks error.
- Secondary client: `src/lib/api-client.ts`
  - Exports `sendMessageStream`.
  - Search did not find imports of `sendMessageStream` in current `src` or `scripts`.
  - It currently treats response chunks as raw text and should be updated or left clearly obsolete to avoid future protocol drift.

## SSE Design Decision

- Use `fetch + ReadableStream` to consume `text/event-stream`, not native `EventSource`.
- Reason: current chat request needs POST JSON body and request abort semantics; native `EventSource` only supports GET and would require a larger two-step job/subscription design.
- Keep event payload shape unchanged so the rest of Zustand/UI logic stays stable:
  - `{ type: 'delta', content: string }`
  - `{ type: 'done', content: string }`
  - `{ type: 'error', message: string }`
- Encode each event as an SSE frame with optional `event:` and JSON `data:`.

## Potential Verification

- Existing project scripts include:
  - `npm.cmd run lint`
  - `npm.cmd run build`
- No new dependency is needed for SSE.
- A focused parser check can be added or run through `tsx` if implementation extracts parser logic enough to test without rendering React.

## 2026-06-17 Extended SSE Protocol Findings

- The previous implementation changed the wire format to SSE, but protocol ownership is still split:
  - `ChatStreamEvent` is separately defined in `src/app/api/chat/route.ts`, `src/stores/chatStore.ts`, `src/lib/api-client.ts`, and `scripts/check-sse-stream.ts`.
  - Conversation and message IDs are still delivered through response headers: `x-conversation-id`, `x-conversation-title`, `x-user-message-id`, `x-ai-message-id`.
  - The frontend still reads those headers before consuming the stream.
- The user now wants a more standard SSE protocol with explicit event types including `metadata`.
- Current best fit remains `fetch + ReadableStream` over `text/event-stream`, not native `EventSource`, because the app needs POST JSON body, image payloads, auth/proxy behavior, and AbortController stop support.
- A better protocol shape is:
  - `metadata`: sent first after conversation/user/AI placeholder messages are persisted; includes `conversationId`, `conversationTitle`, `userMessageId`, and `aiMessageId`.
  - `delta`: streamed model text chunk.
  - `done`: generation completion; includes final content and optionally persisted status/message IDs for confirmation.
  - `error`: stream-level error after the stream has started; includes message and optional partial content.
- Route Handler facts from local Next 16 docs still apply:
  - Route Handlers can stream raw responses via Web Streams API.
  - SSE is an appropriate Route Handler streaming use case.
  - Once streaming starts, headers/status cannot be changed, so metadata needed by the UI should be inside the stream if it is part of the runtime protocol.
- Frontend behavior to preserve:
  - optimistic local conversation for new chats
  - local placeholder answer message
  - AbortController stop behavior
  - append chunks to the current placeholder
  - mark answer `finished` on `done`
  - mark answer `error` while preserving partial text on `error`
- Current cleanup opportunity:
  - `src/stores/chatStore.ts` has a leftover comment block mentioning NDJSON even though the parser function was removed. This should be removed or rewritten during protocol cleanup.
