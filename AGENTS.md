<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:project-coding-preferences -->
# 项目协作偏好

## 技能和计划使用

- 小改动不用 `planning-with-files`，只用简短 todo，然后直接改。
- 只有跨多文件、多阶段、需要恢复上下文，或用户明确要求时，才使用 `planning-with-files`。
- 计划文件只记录关键决策和最终结果，不记录每个小错误的长过程。

## 中文文案和中文注释

- 中文项目里直接正常写中文，不要为了规避编码问题改成 ASCII 英文。
- 新写的用户可见中文文案必须使用正常中文源码字面量，不要写成 `\uXXXX`、`\xXX` 这类 Unicode/hex escape。
- 不要主动处理已有的中文乱码、中文注释、注释编码或历史文案编码问题。
- 除非这些内容直接导致编译失败、运行时报错，或用户明确要求修复，否则忽略它们。

默认使用省 token 模式：只启用与当前任务直接相关的 skills。小改动不要使用 planning-with-files、writing-plans、executing-plans、using-git-worktrees。除非用户明确点名，否则不要读取大型流程类 skills。
<!-- END:project-coding-preferences -->

<!-- BEGIN:codex-skill-workflow-rules -->
# Codex Skill Workflow Rules

- Always load available skills from `.codex/skills/` when a task names or clearly matches an installed skill.
- Follow `verification-before-completion` strictly: run the relevant verification commands, including lint/build when applicable, before reporting work as done.
- Follow `planning-with-files` for new features, multi-step tasks, or tasks that touch more than two files.
- The `superpowers` workflow is optional unless the user explicitly says "follow full superpowers".
- When the user provides code review feedback, follow `receiving-code-review`.
<!-- END:codex-skill-workflow-rules -->
