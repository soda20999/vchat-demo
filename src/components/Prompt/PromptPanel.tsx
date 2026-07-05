'use client';

import { LIFE_PROMPT_TEMPLATES } from '@/ai/prompt/prompt-templates';
import { PillMenu, PillMenuItem, PillMenuTitle } from '@/components/Ui/PillMenu';
import { useChatStore } from '@/stores/chatStore';

const TEMPLATE_LABELS: Record<string, string> = {
  'daily-plan': '规划一天',
  'food-advice': '饮食建议',
  'writing-polish': '写作润色',
  'emotional-support': '情绪陪伴',
};

interface PromptPanelProps {
  openMenu: string | null;
  setOpenMenu: (value: string | null) => void;
}

export function PromptPanel({ openMenu, setOpenMenu }: PromptPanelProps) {
  const templateId = useChatStore((state) => state.promptSettings.templateId);
  const updateSettings = useChatStore((state) => state.updatePromptSettings);

  const applyTemplate = (templateId: string) => {
    const template = LIFE_PROMPT_TEMPLATES.find((item) => item.id === templateId);
    if (!template) return;
    updateSettings({ templateId, systemPrompt: template.systemPrompt });
  };

  return (
    <PillMenu
      icon="lucide:message-square-text"
      label="聊天模式"
      open={openMenu === 'chat'}
      onOpenChange={(next) => setOpenMenu(next ? 'chat' : null)}
    >
      <PillMenuTitle>提示词模板</PillMenuTitle>
      {LIFE_PROMPT_TEMPLATES.map((template) => (
        <PillMenuItem
          key={template.id}
          active={templateId === template.id}
          onClick={() => applyTemplate(template.id)}
        >
          {TEMPLATE_LABELS[template.id] ?? template.name}
        </PillMenuItem>
      ))}
    </PillMenu>
  );
}
