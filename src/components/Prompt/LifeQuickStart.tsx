'use client';

// 文件作用：渲染首页快捷开始按钮，帮助用户用预设生活场景快速发起聊天。
import { getPromptTemplate } from '@/ai/prompt/prompt-templates';
import { useChatStore } from '@/stores/chatStore';

const QUICK_ACTIONS = [
  {
    templateId: 'daily-plan',
    label: '我想安排今天',
    content: '我想安排今天，帮我做一个轻松可执行的计划。',
  },
  {
    templateId: 'food-advice',
    label: '我不知道吃什么',
    content: '我不知道吃什么，给我一点简单实用的建议。',
  },
  {
    templateId: 'writing-polish',
    label: '帮我改一句话',
    content: '帮我把一句话改得更自然一点。',
  },
  {
    templateId: 'emotional-support',
    label: '我想找人聊聊',
    content: '我想找人聊聊，最近有点累。',
  },
];

// 函数名：LifeQuickStart；简单介绍：展示预设快捷问题，点击后应用模板并发送首条消息。
export function LifeQuickStart() {
  const sendMessage = useChatStore((state) => state.sendMessage);
  const updatePromptSettings = useChatStore(
    (state) => state.updatePromptSettings
  );

  // startChat：按模板 ID 设置聊天参数，并发送对应的快捷内容。
  const startChat = async (templateId: string, content: string) => {
    const template = getPromptTemplate(templateId);
    if (template) {
      updatePromptSettings({
        templateId,
        systemPrompt: template.systemPrompt,
        ...template.defaultParams,
      });
    }

    await sendMessage({ content });
  };

  return (
    <div className="mt-6 grid w-full grid-cols-2 gap-3">
      {QUICK_ACTIONS.map((action) => (
        <button
          key={action.templateId}
          type="button"
          onClick={() => void startChat(action.templateId, action.content)}
          className="rounded-2xl bg-white/5 px-4 py-3 text-left text-sm text-gray-200 transition hover:bg-white/10"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
