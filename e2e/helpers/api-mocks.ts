import type { Page, Route } from '@playwright/test';

export type CapturedChatRequest = Record<string, unknown>;

export function sseEvent(event: Record<string, unknown>) {
  return `event: ${String(event.type)}
data: ${JSON.stringify(event)}

`;
}

export async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

export async function mockConversations(page: Page, conversations: unknown[] = []) {
  await page.route('**/api/conversations', async (route) => {
    await fulfillJson(route, { code: 200, data: conversations });
  });
}

export async function mockConversationMessages(page: Page, messages: unknown[] = []) {
  await page.route('**/api/conversations/*/messages', async (route) => {
    await fulfillJson(route, { code: 200, data: messages });
  });
}

export async function mockProviders(page: Page) {
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
  await mockConversations(page, conversations);
  await mockConversationMessages(page);
  await mockProviders(page);
}
