# AI 请求高并发治理

## Goal
为 `/api/chat` 增加 AI 请求治理：Redis Token Bucket 限流、轻量请求队列削峰、分布式锁幂等控制，保护模型调用、数据库写入和 SSE 链路。

## Scope
- 只改后端/API/AI：`src/app/api`、`src/lib`/`src/ai` 相关服务端代码。
- 不改前端组件和样式。
- 保持 `/api/chat` 现有 SSE 事件契约。

## Plan
1. 现状调研：确认 `/api/chat` 插入点、Redis 依赖和测试方式。Status: complete
2. TDD：补并发治理单元测试和 `/api/chat` 接入测试。Status: complete
3. 实现：Redis client、Token Bucket、队列、锁、chat 接入。Status: complete
4. 验证：目标测试、typecheck、全量测试，diff review。Status: complete

## Key Decisions
- 优先使用真实 Redis 客户端依赖，避免手写 Redis 协议。
- npm 安装 `ioredis` 被网络/权限阻止，改为零新增依赖 Redis REST 适配层。
- 未配置 Redis 时 fail-open，不影响本地开发；明确限流/排队/锁拒绝时返回 SSE error。
- 队列使用独立 active TTL，锁使用定时续租，适配长 SSE 流。
