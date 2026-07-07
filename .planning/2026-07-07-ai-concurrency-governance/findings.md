# Findings

- Next Route Handler 文档已读：Route Handler 使用标准 `Request`/`Response`，POST 不缓存，流式响应可用 `ReadableStream`。
- 当前 `/api/chat` 在解析请求、鉴权、建会话、写用户消息/AI 占位消息后才调用模型流。
- `package.json` 当前没有 `redis`、`ioredis`、`@upstash/redis` 依赖。
- `npm.cmd install ioredis` 失败，registry 请求被系统拒绝；按用户指示改为地址/token 占位配置，后续用户填 Redis REST 地址。
- reviewer 指出初版队列 TTL 和锁 TTL 对长 SSE 不够安全；已改为 `AI_QUEUE_ACTIVE_TTL_MS` 和 `AI_LOCK_RENEW_INTERVAL_MS`。
