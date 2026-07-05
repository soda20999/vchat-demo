import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ProfessionalModePanel } from '@/components/Prompt/ProfessionalModePanel';

const updatePromptSettings = vi.fn();
const updateContextOptions = vi.fn();

vi.mock('@/stores/chatStore', () => ({
  useChatStore: (
    selector: (state: {
      promptSettings: {
        templateId: string;
        systemPrompt: string;
        temperature: number;
        topP: number;
        maxTokens: number;
      };
      updatePromptSettings: typeof updatePromptSettings;
      contextOptions: {
        memoryEnabled: boolean;
        summaryEnabled: boolean;
        relevantHistoryEnabled: boolean;
        recentTurns: number;
      };
      updateContextOptions: typeof updateContextOptions;
    }) => unknown,
  ) =>
    selector({
      promptSettings: {
        templateId: '',
        systemPrompt: '保持回复简洁。',
        temperature: 0.7,
        topP: 0.9,
        maxTokens: 1200,
      },
      updatePromptSettings,
      contextOptions: {
        memoryEnabled: true,
        summaryEnabled: false,
        relevantHistoryEnabled: true,
        recentTurns: 8,
      },
      updateContextOptions,
    }),
}));

describe('ProfessionalModePanel', () => {
  it('updates generation params from direct inputs', () => {
    render(<ProfessionalModePanel openMenu="advanced" setOpenMenu={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('温度'), { target: { value: '0.4' } });
    fireEvent.change(screen.getByLabelText('Top P'), { target: { value: '0.8' } });
    fireEvent.change(screen.getByLabelText('最大 Token'), { target: { value: '1600' } });

    expect(updatePromptSettings).toHaveBeenCalledWith({ temperature: 0.4 });
    expect(updatePromptSettings).toHaveBeenCalledWith({ topP: 0.8 });
    expect(updatePromptSettings).toHaveBeenCalledWith({ maxTokens: 1600 });
  });

  it('updates memory settings inside professional mode', () => {
    render(<ProfessionalModePanel openMenu="advanced" setOpenMenu={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: '记忆设置' }));
    fireEvent.click(screen.getByRole('button', { name: '长期记忆 开' }));
    fireEvent.click(screen.getByRole('button', { name: '最近 12 轮' }));

    expect(updateContextOptions).toHaveBeenCalledWith({ memoryEnabled: false });
    expect(updateContextOptions).toHaveBeenCalledWith({ recentTurns: 12 });
  });

  it('shows concise parameter helper text beside labels', () => {
    render(<ProfessionalModePanel openMenu="advanced" setOpenMenu={vi.fn()} />);

    expect(screen.getByText('数值越高，回答越发散。')).toBeTruthy();
    expect(screen.getByText('控制候选词采样范围。')).toBeTruthy();
    expect(screen.getByText('限制单次回答长度。')).toBeTruthy();
  });
});
