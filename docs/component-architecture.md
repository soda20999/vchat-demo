# 前端组件架构规范

本文档用于约定 vchat 前端组件的职责边界、目录归属和依赖方向。后续新增组件、拆分组件、补 Storybook 或增加 ESLint import boundary 时，都以这里的规则作为判断依据。

## 分层目标

组件按职责分为三层：

- `Ui 基础组件`：只负责通用视觉和基础交互，不知道 vchat 的业务概念。
- `业务组件`：负责某个业务域的展示和局部交互，知道业务类型，但不直接发请求、不直接读写全局 store。
- `页面组件 / 容器组件`：负责路由、store、API、副作用、权限和跨组件编排。

依赖方向必须从外到内：

```text
app / containers
  -> features / domain components
    -> ui components
      -> hooks / utils / types
```

低层组件不得反向引用高层模块。

## Ui 基础组件

推荐目录：`src/components/Ui`，后续可逐步迁移为小写 `src/components/ui`。

允许：

- 接收 `className`、`children`、`disabled`、`variant`、`size`、`onClick` 等通用 props。
- 使用通用样式、图标、无业务含义的状态。
- 依赖通用工具函数、React、样式系统。

禁止：

- 直接引用 `src/stores`。
- 直接调用 `fetch`、Route Handler、server action。
- 直接引用 `src/db`、`src/lib/auth`、`src/app/api`。
- 内置聊天、会话、Provider、Prompt、用户等业务语义。

当前建议：

- `ProviderSelecter` 这类知道 Provider 业务概念的组件不应进入 `Ui`，应留在业务目录。
- `SidebarButton` 带有明确侧栏语义，后续更适合放入 `Chat` / `Sidebar` 相关业务目录。
- `Button` 如果继续作为基础按钮，应避免默认带 `w-full justify-between` 这类场景布局；场景布局交给调用方或业务组件。

## 业务组件

推荐目录：

- `src/components/Chat`
- `src/components/Prompt`
- `src/components/Provider`
- `src/components/Attachment`
- `src/components/User`

允许：

- 接收业务类型，例如 `Message`、`Conversation`、`Provider`。
- 组合多个 `Ui` 基础组件。
- 处理局部 UI 状态，例如展开、选中、输入框草稿、菜单开关。
- 暴露事件回调，例如 `onSend`、`onRetry`、`onStop`、`onSelectProvider`。

限制：

- 默认不直接读写 Zustand store。
- 默认不直接调用 API。
- 默认不依赖路由参数和页面跳转。
- 不直接引用 DB、服务端 auth、server response、Route Handler。

例外：

- 对于历史组件，可以先保留现状，但新增代码优先拆出 `View` 组件和 `Container` 组件。
- 当组件必须临时读取 store 时，文件名或导出名应体现容器语义，例如 `MessageListContainer`，避免伪装成纯展示组件。

当前建议：

- `MessageBubble` 后续拆为 `MessageBubbleView`、`MessageActions` 和连接 store 的容器。
- `MessageList` 后续把 Virtuoso 和滚动副作用留在容器层，纯列表渲染单独拆出。
- `MessageInput` 保持输入与提交职责，`PromptPanel`、`ContextStatusBar` 更适合由上层 `ChatComposer` 组合。
- `ProviderSelecter` 是较好的业务展示组件示例：通过 props 接收数据和值，通过回调向外通知变化。

## 页面组件 / 容器组件

推荐位置：

- `src/app/**/page.tsx`
- `src/app/**/layout.tsx`
- `src/components/**/**Container.tsx`
- `src/features/**`，如果后续引入 feature 目录

负责：

- 读取路由参数、执行跳转。
- 调用 API client 或 server action。
- 连接 Zustand store。
- 处理登录态、权限、错误兜底、加载态。
- 编排多个业务组件形成完整页面流程。

约束：

- 页面组件尽量保持薄，只做数据装配和组件编排。
- 大段业务流程应下沉到 `features` 或 `Container`，不要堆在 `page.tsx`。
- 容器组件可以依赖业务组件和 store，但业务展示组件不反向依赖容器。

当前建议：

- `Sidebar` 当前包含路由状态、折叠 UI、设置菜单、登出请求、新会话和会话列表，后续应拆为 `SidebarShell`、`ConversationListContainer`、`SidebarSettingsMenu` 等更小单元。
- `LifeQuickStart` 直接发送消息，后续应改为通过上层传入 `onSendPrompt`，减少它对聊天流程的耦合。

## API 与类型边界

前端组件只能依赖前端可用的类型和契约：

- 可依赖：`src/types` 中的纯类型、前端 DTO、Zod schema、API client 类型。
- 不可依赖：`src/db`、`src/lib/auth`、`src/lib/server-response`、`src/app/api`。

请求和响应建议统一经过前端 API client 或共享 schema，不在组件里临时拼装和解析复杂响应。组件拿到的数据应尽量是 UI 可直接使用的 hydrated 类型，例如把 API 返回的时间字符串在边界层转换为 `Date` 或格式化字符串。

## 命名规范

- 基础组件：`Button`、`PillMenu`、`TogglePill`。
- 业务展示组件：`MessageBubbleView`、`ProviderSelecter`、`ConversationList`。
- 容器组件：`MessageListContainer`、`SidebarContainer`、`ChatComposerContainer`。
- 页面级组合：`ChatPage`、`ConversationPage`，通常在 `app` 下作为页面内部组件或直接由 `page.tsx` 组合。

命名应让读者不用打开文件也能判断它是否会读 store、发请求或处理路由。

## 新增组件检查清单

新增或重构组件前，先回答：

- 这个组件是否可以只靠 props 渲染？可以的话优先做成展示组件。
- 它是否需要读 store、调 API、跳转页面？需要的话命名为容器组件或放到页面层。
- 它是否知道聊天、Provider、Prompt 等业务概念？知道的话不要放到 `Ui`。
- 它是否直接引用了 `src/db`、`src/lib/auth`、`src/app/api`？如果是，说明边界越层。
- 它的状态是否适合 Storybook 单独展示？如果不适合，优先拆出纯展示子组件。

## 后续落地顺序

1. 增加 ESLint import boundary，先用 `no-restricted-imports` 禁止组件层引用 DB、auth、server response、Route Handler。
2. 统一 API 请求 / 响应契约，优先处理 chat request、response envelope 和 conversation DTO。
3. 拆分 DTO 与 UI hydrated 类型，避免组件直接消费不稳定的接口结构。
4. 引入 Storybook，先沉淀 `Button`、`SidebarButton`、`ProviderSelecter`、`MessageBubbleView` 等可独立展示状态。
5. 按风险从低到高拆分 `MessageBubble`、`MessageInput`、`Sidebar`。
