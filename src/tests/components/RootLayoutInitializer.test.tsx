import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { RootLayoutInitializer } from '@/app/RootLayoutInitializer';
import type { VchatBroadcastEvent } from '@/lib/vchat-broadcast';

const replace = vi.fn();
const refresh = vi.fn();
const initialize = vi.fn();
const refreshConversations = vi.fn();
const switchConversation = vi.fn();
let subscribedHandler: ((event: VchatBroadcastEvent) => void) | null = null;

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ replace, refresh }),
}));

vi.mock('@/lib/vchat-broadcast', () => ({
  subscribeVchatEvents: (handler: (event: VchatBroadcastEvent) => void) => {
    subscribedHandler = handler;
    return vi.fn();
  },
}));

vi.mock('@/stores/chatStore', () => ({
  useChatStore: (selector: (state: unknown) => unknown) =>
    selector({
      initialize,
      refreshConversations,
      switchConversation,
      currentConversationId: 1,
    }),
}));

describe('RootLayoutInitializer broadcast handling', () => {
  it('refreshes conversations and current messages from vchat broadcasts', () => {
    render(<RootLayoutInitializer />);

    expect(initialize).toHaveBeenCalled();

    subscribedHandler?.({ type: 'conversation:updated', sourceId: 'other', conversationId: 1 });
    subscribedHandler?.({ type: 'message:finished', sourceId: 'other', conversationId: 1 });

    expect(refreshConversations).toHaveBeenCalled();
    expect(switchConversation).toHaveBeenCalledWith(1);
  });

  it('redirects to auth when another tab logs out', () => {
    render(<RootLayoutInitializer />);

    subscribedHandler?.({ type: 'auth:logout', sourceId: 'other' });

    expect(refresh).toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith('/auth');
  });
});
