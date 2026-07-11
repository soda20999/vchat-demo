'use client';

import { Icon } from '@iconify/react';

type SidebarToggleButtonProps = {
  expanded: boolean;
  onToggle: () => void;
};

export function SidebarToggleButton({ expanded, onToggle }: SidebarToggleButtonProps) {
  return (
    <div className="group relative">
      <button
        type="button"
        aria-label={expanded ? '收起菜单' : '展开菜单'}
        aria-expanded={expanded}
        data-testid="sidebar-toggle"
        onClick={onToggle}
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
  );
}
