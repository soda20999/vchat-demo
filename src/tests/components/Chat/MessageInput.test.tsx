import type React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MessageInput } from '@/components/Chat/MessageInput';

vi.mock('@/components/Chat/ChatToolbar', () => ({
  ChatToolbar: ({ children, end }: { children?: React.ReactNode; end?: React.ReactNode }) => (
    <div>
      {children}
      {end}
    </div>
  ),
}));

vi.mock('@/components/Chat/RoleRadialMenu', () => ({
  RoleRadialMenu: () => <div />,
}));

vi.mock('@/components/Prompt/PromptPanel', () => ({
  PromptPanel: () => <div />,
}));

vi.mock('@/components/Prompt/ProfessionalModePanel', () => ({
  ProfessionalModePanel: () => <div />,
}));

vi.mock('@/components/Attachment/ImageUploadTrigger', () => ({
  ImageUploadTrigger: () => <button type="button">upload</button>,
}));

vi.mock('@/hooks/useImageHandling', () => ({
  useImageHandling: () => ({
    selectedFile: null,
    previewUrl: null,
    handleImageSelect: vi.fn(),
    clearImage: vi.fn(),
  }),
}));

describe('MessageInput', () => {
  it('keeps text and restores the send button when sending fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const onSend = vi.fn().mockRejectedValue(new Error('network failed'));

    render(<MessageInput selectedModel="qwen-plus" conversationId={1} onSend={onSend} />);

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    const sendButton = screen.getByTestId('chat-send-button') as HTMLButtonElement;

    fireEvent.change(textarea, { target: { value: '失败后保留' } });
    fireEvent.click(sendButton);

    await waitFor(() => expect(onSend).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(sendButton.disabled).toBe(false));
    expect(textarea.value).toBe('失败后保留');

    consoleError.mockRestore();
  });

  it('does not send empty text or repeat while a send is pending', async () => {
    let resolveSend: () => void = () => undefined;
    const onSend = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSend = resolve;
        }),
    );

    render(<MessageInput selectedModel="qwen-plus" conversationId={1} onSend={onSend} />);

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    const sendButton = screen.getByTestId('chat-send-button') as HTMLButtonElement;

    expect(sendButton.disabled).toBe(true);

    fireEvent.change(textarea, { target: { value: '发送中保护' } });
    fireEvent.click(sendButton);
    fireEvent.click(sendButton);

    expect(onSend).toHaveBeenCalledTimes(1);
    expect(sendButton.disabled).toBe(true);

    resolveSend();
    await waitFor(() => expect(textarea.value).toBe(''));
    expect(sendButton.disabled).toBe(true);
  });
});