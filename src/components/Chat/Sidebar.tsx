'use client';

import { Icon } from '@iconify/react';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

import { ConversationList } from '@/components/Chat/ConversationList';
import { ConfirmDialog } from '@/components/Ui/ConfirmDialog';
import { ErrorState } from '@/components/Ui/ErrorState';
import { SidebarButton } from '@/components/Ui/SidebarButton';
import { useChatStore } from '@/stores/chatStore';

const ACTIONS = [{ icon: 'lucide:square-pen', label: '发起新对话', action: 'new-chat' as const }];

function SettingsMenu({
  open,
  expanded,
  loggingOut,
  errorMessage,
  onLogout,
}: {
  open: boolean;
  expanded: boolean;
  loggingOut: boolean;
  errorMessage: string;
  onLogout: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className={`absolute bottom-14 z-40 w-[248px] rounded-[20px] bg-[#202020] px-2 py-2 shadow-[0_18px_40px_rgba(0,0,0,0.45)] ${
        expanded ? 'right-4' : 'left-5'
      }`}
    >
      <button
        type="button"
        onClick={onLogout}
        disabled={loggingOut}
        className="flex h-10 w-full items-center gap-3 rounded-[14px] border border-transparent bg-[#202020] px-3 text-left text-[14px] font-semibold text-[#ef4444] transition-[border-color,background-color,box-shadow] duration-150 hover:border-[#ef4444] hover:bg-[#252020] hover:shadow-[0_0_14px_rgba(239,68,68,0.22)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Icon icon="lucide:log-out" className="h-5 w-5 shrink-0 text-[#ef4444]" />
        <span>{loggingOut ? '正在登出...' : '登出账号'}</span>
      </button>
      {errorMessage ? (
        <ErrorState
          compact
          title="登出失败"
          description={errorMessage}
          className="mt-2 !items-start !px-3 !py-3 !text-left"
        />
      ) : null}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const switchConversation = useChatStore((state) => state.switchConversation);

  if (pathname === '/auth') return null;

  const handleNewConversation = async () => {
    setSettingsOpen(false);
    await switchConversation(0);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    setLogoutError('');

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message || '登出失败，请稍后重试');
      }

      router.refresh();
      router.replace('/auth');
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : '登出失败，请稍后重试');
      setLoggingOut(false);
      setLogoutConfirmOpen(false);
    }
  };

  const toggleSettings = () => {
    setLogoutError('');
    setSettingsOpen((value) => !value);
  };

  return (
    <aside
      className={`relative h-full border-r border-[#2a2a2a] bg-[#1f1f1f] text-[#d6d6d6] transition-[width] duration-300 ease-out ${
        expanded ? 'w-[286px]' : 'w-[64px]'
      }`}
    >
      <SettingsMenu
        open={settingsOpen}
        expanded={expanded}
        loggingOut={loggingOut}
        errorMessage={logoutError}
        onLogout={() => setLogoutConfirmOpen(true)}
      />
      <ConfirmDialog
        open={logoutConfirmOpen}
        title="确认退出登录？"
        description="退出后需要重新登录才能继续使用当前账号。"
        confirmText="退出"
        cancelText="取消"
        variant="danger"
        loading={loggingOut}
        onOpenChange={setLogoutConfirmOpen}
        onConfirm={() => void handleLogout()}
      />

      <div
        className={`flex h-full flex-col ${expanded ? 'px-4 py-3' : 'items-center px-0 py-2.5'}`}
      >
        <div className={`flex items-center ${expanded ? 'justify-between' : 'justify-center'}`}>
          <div className="group relative">
            <button
              type="button"
              aria-label={expanded ? '收起菜单' : '展开菜单'}
              onClick={() => setExpanded((value) => !value)}
              className={`flex shrink-0 items-center justify-center rounded-full text-[#d4d4d4] transition-colors hover:text-white ${
                expanded ? 'h-8 w-8' : 'h-9 w-9 bg-[#2b2b2b]'
              }`}
            >
              <Icon icon="lucide:menu" className="h-5 w-5" />
            </button>

            {!expanded ? (
              <div className="pointer-events-none absolute left-0 top-full z-20 mt-3 rounded-[6px] bg-white px-3 py-1.5 text-[12px] font-medium whitespace-nowrap text-[#4a4a4a] opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100">
                展开菜单
              </div>
            ) : null}
          </div>

          {expanded ? <div className="h-8 w-8" aria-hidden="true" /> : null}
        </div>

        {expanded ? (
          <>
            <div className="mt-5 space-y-1">
              <SidebarButton
                icon={<Icon icon={ACTIONS[0].icon} className="h-4.5 w-4.5 text-[#d4d4d4]" />}
                onClick={() => void handleNewConversation()}
                textClassName="font-semibold text-[#d6d6d6]"
              >
                {ACTIONS[0].label}
              </SidebarButton>
            </div>

            <div className="mt-5 flex min-h-0 flex-1 flex-col">
              <h2 className="px-2 text-[14px] font-semibold text-[#ececec]">对话</h2>
              <div className="mt-2 min-h-0 flex-1">
                <ConversationList />
              </div>
            </div>
          </>
        ) : (
          <div className="mt-8 flex flex-1 flex-col items-center">
            <button
              type="button"
              aria-label="发起新对话"
              onClick={() => void handleNewConversation()}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-[#d4d4d4] transition-colors hover:bg-[#2a2a2a] hover:text-white"
            >
              <Icon icon="lucide:square-pen" className="h-4.5 w-4.5" />
            </button>

            <div className="mb-3 mt-auto flex flex-col items-center gap-3">
              <button
                type="button"
                aria-label="设置"
                aria-expanded={settingsOpen}
                onClick={toggleSettings}
                className={`relative flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                  settingsOpen
                    ? 'bg-[#2a2a2a] text-white'
                    : 'text-[#d4d4d4] hover:bg-[#2a2a2a] hover:text-white'
                }`}
              >
                <Icon icon="lucide:settings" className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        )}

        {expanded ? (
          <div className="flex justify-end pt-2.5">
            <button
              type="button"
              aria-label="设置"
              aria-expanded={settingsOpen}
              onClick={toggleSettings}
              className={`relative flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                settingsOpen
                  ? 'bg-[#2a2a2a] text-white'
                  : 'text-[#d4d4d4] hover:bg-[#2a2a2a] hover:text-white'
              }`}
            >
              <Icon icon="lucide:settings" className="h-4.5 w-4.5" />
            </button>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
