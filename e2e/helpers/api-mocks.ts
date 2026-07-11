import type { Page, Route } from '@playwright/test';

export type CapturedChatRequest = Record<string, unknown>;

export function sseEvent(event: Record<string, unknown>) {
  // 按浏览器端 SSE 解析器期望的格式拼接事件，模拟真实 /api/chat 流式返回。
  return `event: ${String(event.type)}
data: ${JSON.stringify(event)}

`;
}

export async function fulfillJson(route: Route, body: unknown, status = 200) {
  // 项目 API 统一返回 JSON，这个小工具避免每个 mock 重复写 fulfill 配置。
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

export async function mockConversations(page: Page, conversations: unknown[] = []) {
  // mock 会话列表，默认空数组；需要导航列表时由用例传入测试会话。
  await page.route('**/api/conversations', async (route) => {
    await fulfillJson(route, { code: 200, data: conversations });
  });
}

export async function mockConversationMessages(page: Page, messages: unknown[] = []) {
  // mock 历史消息接口，避免切换会话时访问真实数据库。
  await page.route('**/api/conversations/*/messages', async (route) => {
    await fulfillJson(route, { code: 200, data: messages });
  });
}

export async function mockProviders(page: Page) {
  // 固定返回一个测试模型，保证输入框发送按钮可以进入可发送状态。
  await page.route('**/api/providers', async (route) => {
    await fulfillJson(route, {
      code: 200,
      data: [
        {
          id: 1,
          name: 'test-provider',
          title: 'Test Provider',
          desc: 'Provider for E2E tests',
          avatar: '',
          models: ['test-model'],
          createdAt: '2026-07-10T00:00:00.000Z',
          updatedAt: '2026-07-10T00:00:00.000Z',
        },
      ],
    });
  });
}

export async function mockChatStream(
  page: Page,
  capturedRequests: CapturedChatRequest[],
  options: { status?: number; message?: string; answer?: string } = {},
) {
  await page.route('**/api/chat', async (route) => {
    // 记录请求体，方便用例断言 content/model/prompt/context 等关键字段。
    capturedRequests.push(route.request().postDataJSON() as CapturedChatRequest);

    if (options.status && options.status >= 400) {
      await fulfillJson(route, { message: options.message ?? 'E2E chat failed' }, options.status);
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: [
        sseEvent({
          type: 'metadata',
          conversationId: 101,
          conversationTitle: 'Playwright chat',
          userMessageId: 201,
          aiMessageId: 202,
        }),
        sseEvent({ type: 'delta', content: options.answer ?? 'E2E streamed answer' }),
        sseEvent({ type: 'done', content: '' }),
      ].join(''),
    });
  });
}

export async function mockChatShell(page: Page, conversations: unknown[] = []) {
  // 聊天页启动所需的基础接口集合，大多数 E2E 只需要调用这一个 helper。
  await mockConversations(page, conversations);
  await mockConversationMessages(page);
  await mockProviders(page);
}
