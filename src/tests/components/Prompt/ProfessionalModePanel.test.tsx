import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ProfessionalModePanel } from '@/components/Prompt/ProfessionalModePanel';

const DEFAULT_PROMPT_SETTINGS = {
  templateId: '',
  systemPrompt: '保持回复简洁。',
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 1200,
};
const DEFAULT_CONTEXT_OPTIONS = {
  memoryEnabled: true,
  summaryEnabled: false,
  relevantHistoryEnabled: true,
  recentTurns: 8,
};
const updatePromptSettings = vi.fn();
const updateContextOptions = vi.fn();

vi.mock('@/stores/chatStore', () => ({
  useChatStore: (
    selector: (state: {
      promptSettings: typeof DEFAULT_PROMPT_SETTINGS;
      updatePromptSettings: typeof updatePromptSettings;
      contextOptions: typeof DEFAULT_CONTEXT_OPTIONS;
      updateContextOptions: typeof updateContextOptions;
    }) => unknown,
  ) =>
    selector({
      promptSettings: DEFAULT_PROMPT_SETTINGS,
      updatePromptSettings,
      contextOptions: DEFAULT_CONTEXT_OPTIONS,
      updateContextOptions,
    }),
}));

function renderProfessionalMode() {
  render(<ProfessionalModePanel openMenu="advanced" setOpenMenu={vi.fn()} />);
}

function changeNumberField(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function openMemorySettings() {
  fireEvent.click(screen.getByRole('button', { name: '记忆设置' }));
}

describe('ProfessionalModePanel', () => {
  it('updates generation params from direct inputs', () => {
    renderProfessionalMode();

    changeNumberField('温度', '0.4');
    changeNumberField('Top P', '0.8');
    changeNumberField('最大 Token', '1600');

    expect(updatePromptSettings).toHaveBeenCalledWith({ temperature: 0.4 });
    expect(updatePromptSettings).toHaveBeenCalledWith({ topP: 0.8 });
    expect(updatePromptSettings).toHaveBeenCalledWith({ maxTokens: 1600 });
  });

  it('updates memory settings inside professional mode', () => {
    renderProfessionalMode();

    openMemorySettings();
    fireEvent.click(screen.getByRole('button', { name: '长期记忆 开' }));
    fireEvent.click(screen.getByRole('button', { name: '最近 12 轮' }));

    expect(updateContextOptions).toHaveBeenCalledWith({ memoryEnabled: false });
    expect(updateContextOptions).toHaveBeenCalledWith({ recentTurns: 12 });
  });

  it('shows concise parameter helper text beside labels', () => {
    renderProfessionalMode();

    expect(screen.getByText('数值越高，回答越发散。')).toBeTruthy();
    expect(screen.getByText('控制候选词采样范围。')).toBeTruthy();
    expect(screen.getByText('限制单次回答长度。')).toBeTruthy();
  });
  it('updates system prompt from the textarea', () => {
    renderProfessionalMode();

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Answer with concise project context.' },
    });

    expect(updatePromptSettings).toHaveBeenCalledWith({
      systemPrompt: 'Answer with concise project context.',
    });
  });
});
