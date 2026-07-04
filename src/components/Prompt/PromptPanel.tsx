'use client';

// 文件作用：渲染聊天设置和限制条件菜单，用来选择提示词模板、回复风格和回复长度。
import { LIFE_PROMPT_TEMPLATES } from '@/ai/prompt/prompt-templates';
import { PillMenu, PillMenuItem, PillMenuTitle } from '@/components/Ui/PillMenu';
import { useChatStore } from '@/stores/chatStore';

const TEXT = {
  chat: '聊天设置',
  limit: '限制条件',
  mode: '聊天模式',
  style: '回复风格',
  length: '回复长度',
};

const TEMPLATE_LABELS: Record<string, string> = {
  'daily-plan': '规划一天',
  'food-advice': '吃点什么',
  'writing-polish': '帮我润色',
  'emotional-support': '陪我聊聊',
};

interface PromptPanelProps {
  // openMenu：当前打开的菜单名称。
  openMenu: string | null;
  // setOpenMenu：切换菜单打开状态的函数。
  setOpenMenu: (value: string | null) => void;
}

const STYLE_OPTIONS = [
  { label: '稳重', temperature: 0.3, topP: 0.85 },
  { label: '自然', temperature: 0.6, topP: 0.9 },
  { label: '活泼', temperature: 0.8, topP: 0.95 },
];

const LENGTH_OPTIONS = [
  { label: '简短', maxTokens: 600 },
  { label: '适中', maxTokens: 1200 },
  { label: '详细', maxTokens: 2000 },
];

// 函数名：PromptPanel；简单介绍：提供提示词模板、回复风格和长度限制的快捷设置；参数变量名：openMenu、setOpenMenu。
export function PromptPanel({ openMenu, setOpenMenu }: PromptPanelProps) {
  const templateId = useChatStore((state) => state.promptSettings.templateId);
  const updateSettings = useChatStore((state) => state.updatePromptSettings);

  // applyTemplate：根据模板 ID 应用系统提示词和默认生成参数。
  const applyTemplate = (templateId: string) => {
    const template = LIFE_PROMPT_TEMPLATES.find((item) => item.id === templateId);
    if (!template) return;
    updateSettings({ templateId, systemPrompt: template.systemPrompt, ...template.defaultParams });
  };

  return (
    <>
      <PillMenu
        icon="lucide:sliders-horizontal"
        label={TEXT.chat}
        open={openMenu === 'chat'}
        onOpenChange={(next) => setOpenMenu(next ? 'chat' : null)}
      >
        <PillMenuTitle>{TEXT.mode}</PillMenuTitle>
        {LIFE_PROMPT_TEMPLATES.map((template) => (
          <PillMenuItem
            key={template.id}
            active={templateId === template.id}
            onClick={() => applyTemplate(template.id)}
          >
            {TEMPLATE_LABELS[template.id] ?? template.name}
          </PillMenuItem>
        ))}

        <PillMenuTitle>{TEXT.style}</PillMenuTitle>
        {STYLE_OPTIONS.map((option) => (
          <PillMenuItem
            key={option.label}
            onClick={() => updateSettings({ temperature: option.temperature, topP: option.topP })}
          >
            {option.label}
          </PillMenuItem>
        ))}
      </PillMenu>

      <PillMenu
        icon="lucide:list-filter"
        label={TEXT.limit}
        open={openMenu === 'limit'}
        onOpenChange={(next) => setOpenMenu(next ? 'limit' : null)}
      >
        <PillMenuTitle>{TEXT.length}</PillMenuTitle>
        {LENGTH_OPTIONS.map((option) => (
          <PillMenuItem
            key={option.label}
            onClick={() => updateSettings({ maxTokens: option.maxTokens })}
          >
            {option.label}
          </PillMenuItem>
        ))}
      </PillMenu>
    </>
  );
}
