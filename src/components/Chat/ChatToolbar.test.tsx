import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChatToolbar } from './ChatToolbar';

describe('ChatToolbar', () => {
  it('groups chat controls and actions', () => {
    render(
      <ChatToolbar
        start={<button type="button">模型</button>}
        end={<button type="button">上传</button>}
      >
        <button type="button">上下文</button>
        <button type="button">Prompt</button>
      </ChatToolbar>,
    );

    expect(screen.getByRole('toolbar', { name: '聊天工具栏' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '模型' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '上传' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '上下文' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Prompt' })).toBeTruthy();
  });
});
