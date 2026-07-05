'use client';

import { Icon } from '@iconify/react';

import { ConversationList } from '@/components/Chat/ConversationList';
import { SidebarButton } from '@/components/Ui/SidebarButton';

const NEW_CHAT_ACTION = {
  icon: 'lucide:square-pen',
  label: '发起新对话',
};

type SidebarBodyProps = {
  expanded: boolean;
  settingsOpen: boolean;
  onNewConversation: () => void;
  onToggleSettings: () => void;
};

function SettingsButton({
  settingsOpen,
  onToggleSettings,
}: {
  settingsOpen: boolean;
  onToggleSettings: () => void;
}) {
  return (
    <button
      type="button"
      aria-label="设置"
      aria-expanded={settingsOpen}
      onClick={onToggleSettings}
      className={`relative flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
        settingsOpen
          ? 'bg-[#2a2a2a] text-white'
          : 'text-[#d4d4d4] hover:bg-[#2a2a2a] hover:text-white'
      }`}
    >
      <Icon icon="lucide:settings" className="h-4.5 w-4.5" />
    </button>
  );
}

export function SidebarBody({
  expanded,
  settingsOpen,
  onNewConversation,
  onToggleSettings,
}: SidebarBodyProps) {
  if (!expanded) {
    return (
      <div className="mt-8 flex flex-1 flex-col items-center">
        <button
          type="button"
          aria-label="发起新对话"
          onClick={onNewConversation}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-[#d4d4d4] transition-colors hover:bg-[#2a2a2a] hover:text-white"
        >
          <Icon icon={NEW_CHAT_ACTION.icon} className="h-4.5 w-4.5" />
        </button>

        <div className="mb-3 mt-auto flex flex-col items-center gap-3">
          <SettingsButton settingsOpen={settingsOpen} onToggleSettings={onToggleSettings} />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mt-5 space-y-1">
        <SidebarButton
          icon={<Icon icon={NEW_CHAT_ACTION.icon} className="h-4.5 w-4.5 text-[#d4d4d4]" />}
          onClick={onNewConversation}
          textClassName="font-semibold text-[#d6d6d6]"
        >
          {NEW_CHAT_ACTION.label}
        </SidebarButton>
      </div>

      <div className="mt-5 flex min-h-0 flex-1 flex-col">
        <h2 className="px-2 text-[14px] font-semibold text-[#ececec]">对话</h2>
        <div className="mt-2 min-h-0 flex-1">
          <ConversationList />
        </div>
      </div>

      <div className="flex justify-end pt-2.5">
        <SettingsButton settingsOpen={settingsOpen} onToggleSettings={onToggleSettings} />
      </div>
    </>
  );
}
