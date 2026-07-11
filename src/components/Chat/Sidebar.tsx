'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

import { SidebarBody } from '@/components/Chat/SidebarBody';
import { SidebarSettingsMenu } from '@/components/Chat/SidebarSettingsMenu';
import { SidebarToggleButton } from '@/components/Chat/SidebarToggleButton';
import { ConfirmDialog } from '@/components/Ui/ConfirmDialog';
import { broadcastVchatEvent } from '@/lib/vchat-broadcast';
import { useChatStore } from '@/stores/chatStore';

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

      broadcastVchatEvent({ type: 'auth:logout' });
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
      <SidebarSettingsMenu
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
          <SidebarToggleButton
            expanded={expanded}
            onToggle={() => setExpanded((value) => !value)}
          />
          {expanded ? <div className="h-8 w-8" aria-hidden="true" /> : null}
        </div>

        <SidebarBody
          expanded={expanded}
          settingsOpen={settingsOpen}
          onNewConversation={() => void handleNewConversation()}
          onToggleSettings={toggleSettings}
        />
      </div>
    </aside>
  );
}
