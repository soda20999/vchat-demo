'use client';

import { getContextPolicy } from '@/ai/context/context-policy';
import { PillMenu, PillMenuItem, PillMenuTitle } from '@/components/Ui/PillMenu';
import { useChatStore } from '@/stores/chatStore';

const RECENT_TURNS = [4, 8, 12];

interface ContextStatusBarProps {
  openMenu: string | null;
  setOpenMenu: (value: string | null) => void;
}

// 聊天上下文开关：控制长期记忆、摘要、相关历史和最近轮数。
export function ContextStatusBar({ openMenu, setOpenMenu }: ContextStatusBarProps) {
  const selectedModel = useChatStore((state) => state.selectedModel);
  const conversationSummary = useChatStore(
    (state) =>
      state.conversations.find((item) => item.id === state.currentConversationId)
        ?.summary
  );
  const memoryEnabled = useChatStore((state) => state.contextOptions.memoryEnabled);
  const summaryEnabled = useChatStore((state) => state.contextOptions.summaryEnabled);
  const relevantHistoryEnabled = useChatStore(
    (state) => state.contextOptions.relevantHistoryEnabled
  );
  const recentTurnsOption = useChatStore((state) => state.contextOptions.recentTurns);
  const updateOptions = useChatStore((state) => state.updateContextOptions);

  if (!selectedModel) return null;

  const recentTurns = recentTurnsOption || getContextPolicy(selectedModel).recentTurns;
  const currentIndex = RECENT_TURNS.indexOf(recentTurns);
  const nextTurns = RECENT_TURNS[(currentIndex + 1) % RECENT_TURNS.length] ?? 8;

  return (
    <PillMenu
      icon="lucide:brain"
      label="记忆设置"
      open={openMenu === 'memory'}
      onOpenChange={(next) => setOpenMenu(next ? 'memory' : null)}
    >
      <PillMenuTitle>记忆设置</PillMenuTitle>
      <PillMenuItem active={memoryEnabled} onClick={() => updateOptions({ memoryEnabled: !memoryEnabled })}>
        记住聊天
      </PillMenuItem>
      <PillMenuItem active={summaryEnabled} onClick={() => updateOptions({ summaryEnabled: !summaryEnabled })}>
        {conversationSummary ? '使用会话摘要' : '等待生成摘要'}
      </PillMenuItem>
      <PillMenuItem active={relevantHistoryEnabled} onClick={() => updateOptions({ relevantHistoryEnabled: !relevantHistoryEnabled })}>
        回想相关历史
      </PillMenuItem>
      <PillMenuItem onClick={() => updateOptions({ recentTurns: nextTurns })}>
        最近 {recentTurns} 轮
      </PillMenuItem>
    </PillMenu>
  );
}
