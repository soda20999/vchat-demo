'use client';

import { Icon } from '@iconify/react';

import { ErrorState } from '@/components/Ui/ErrorState';

type SidebarSettingsMenuProps = {
  open: boolean;
  expanded: boolean;
  loggingOut: boolean;
  errorMessage: string;
  onLogout: () => void;
};

export function SidebarSettingsMenu({
  open,
  expanded,
  loggingOut,
  errorMessage,
  onLogout,
}: SidebarSettingsMenuProps) {
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
