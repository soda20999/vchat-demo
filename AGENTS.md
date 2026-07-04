<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:project-coding-preferences -->
# 项目协作偏好


## 中文文案和中文注释

- 中文项目里直接正常写中文，不要为了规避编码问题改成 ASCII 英文。
- 新写的用户可见中文文案必须使用正常中文源码字面量，不要写成 `\uXXXX`、`\xXX` 这类 Unicode/hex escape。
- 不要主动处理已有的中文乱码、中文注释、注释编码或历史文案编码问题。
- 除非这些内容直接导致编译失败、运行时报错，或用户明确要求修复，否则忽略它们。

## 省 token 默认策略

- 默认只启用与当前任务直接相关的 skills。
- 小改动不要使用 `planning-with-files`、`writing-plans`、`executing-plans`、`using-git-worktrees`。
- 除非用户明确点名，否则不要读取大型流程类 skills。
<!-- END:project-coding-preferences -->

<!-- BEGIN:codex-conversation-modes -->
# Codex 对话模式

用户可以用短口令切换协作模式。用户没有说模式时，Codex 应根据需求自动判断最合适的模式，不要要求用户重复说明流程。

## 默认自动判断

- 需求主要是页面、组件、样式、交互、用户可见文案时，自动按“前端组件模式”执行。
- 需求主要是接口、认证、数据库、服务端校验、数据流时，自动按“后端接口模式”执行。
- 需求涉及前后端联动、数据库和 UI 同时变化、登录权限、跨多个模块，自动按“主控模式”执行。
- 需求是检查、修 bug、看 diff、跑测试、代码审查时，自动按“测试验收模式”执行。
- 用户明确说某个模式时，以用户指定模式为准。

## 默认多 agent 策略

- 用户平时只需要描述需求，不需要反复说明“使用多 agent”。
- 如果任务能自然拆成只读探索、代码实现、测试验收，且拆分能降低上下文混乱或节省时间，Codex 可以主动在当前对话内部使用多 agent。
- 小改动默认不启用多 agent，直接读相关文件并最小修改。
- 中大型任务默认优先采用三段式多 agent：`explorer` 只读找上下文，`worker` 按明确文件范围实现，`reviewer/tester` 检查 diff 和验证。
- 不要为了形式使用多 agent；如果单 agent 更快更稳，就直接完成。

## 前后端边界

- 前端组件模式可以只读后端 API、类型、认证代码来理解数据来源，但默认不得修改后端文件。
- 后端接口模式可以只读前端页面、组件、请求调用来理解接口需求，但默认不得修改前端文件。
- 主控模式可以协调前后端改动，但必须避免多个 agent 同时写同一个文件。
- 如果确实需要跨边界修改，必须在回复中说明原因、涉及文件和验证方式。
- 多 agent 并行时，每个 agent 必须有明确写入范围；不允许两个 worker 同时修改同一个文件或同一模块。

## 主控模式

触发口令：`主控模式`、`主控集成模式`、`vchat 主控`。

- 负责理解需求、拆任务、协调前端/后端/测试模块。
- 可以使用多 agent，但最终必须由主控完成集成、验收和结果汇总。
- 适合中大型功能、跨模块改动、需要并行探索的任务。
- 输出时说明关键决策、修改文件、验证命令和剩余风险。

## 前端组件模式

触发口令：`前端组件模式`、`前端模式`、`组件模式`。

- 只负责前端 UI、组件、交互、样式和用户可见文案。
- 优先复用已有组件、图标库和设计风格。
- 不主动修改后端 API、数据库 schema、认证逻辑，除非用户明确要求。
- 完成后至少跑与改动相关的前端测试和 `typecheck`；必要时跑 `lint` / `build`。

## 后端接口模式

触发口令：`后端接口模式`、`后端模式`、`API 模式`。

- 只负责 `src/app/api`、`src/db`、`src/lib/auth`、服务端校验、接口行为和数据流。
- 涉及 Next Route Handler、cookies、redirect、server actions 时，先读 `node_modules/next/dist/docs/` 相关文档。
- 不主动修改前端样式和组件，除非用户明确要求。
- 完成后补充或更新接口测试，并跑 `typecheck` 和相关测试。

## 测试验收模式

触发口令：`测试验收模式`、`验收模式`、`review 模式`。

- 主要负责检查改动、补测试、跑验证、发现 bug 和遗漏。
- 优先输出：发现的问题、影响范围、建议修复、验证命令和结果。
- 不做大范围重构；如果需要修复，保持改动最小。

## 模式使用规则

- 小改动不需要新开多个长期对话，一个模式内直接完成即可。
- 多 agent 只在任务能自然拆分、文件写入范围不冲突、或并行探索明显省时间时使用。
- 多 agent 的结果不能直接视为完成，主控或当前对话必须复核 diff 并运行验证。
- 每个 agent 都要有清楚边界，例如“只查不改”“只改前端”“只改后端”。
<!-- END:codex-conversation-modes -->

<!-- BEGIN:codex-skill-workflow-rules -->
