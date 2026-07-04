'use client';

// 文件作用：封装胶囊按钮式弹出菜单，以及菜单标题和菜单项组件。
import React, { useState, type ReactNode } from 'react';
import { Icon } from '@iconify/react';

type PillMenuProps = {
  // icon：按钮左侧图标名称。
  icon: string;
  // label：按钮显示文字。
  label: string;
  // children：弹出层内的菜单内容。
  children: ReactNode;
  // open：受控打开状态。
  open?: boolean;
  // onOpenChange：受控状态变化回调。
  onOpenChange?: (open: boolean) => void;
};

type PillMenuItemProps = {
  // active：菜单项是否为当前激活项。
  active?: boolean;
  // children：菜单项显示内容。
  children: ReactNode;
  // onClick：点击菜单项触发的函数。
  onClick: () => void;
};

/**
 * 函数名：PillMenu
 * 简单介绍：渲染一个胶囊按钮，并在打开时展示浮层菜单。
 * 参数变量名：icon、label、children、open、onOpenChange。
 */
export const PillMenu = React.memo(function PillMenu({
  icon,
  label,
  children,
  open,
  onOpenChange,
}: PillMenuProps) {
  const [innerOpen, setInnerOpen] = useState(false);
  const isOpen = open ?? innerOpen;
  const setOpen = onOpenChange ?? setInnerOpen;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full bg-[#2f3033] px-4 py-2 text-sm font-semibold text-gray-200 hover:bg-[#3a3b3f]"
      >
        <Icon icon={icon} className="h-4 w-4" />
        {label}
      </button>

      {isOpen ? (
        <div className="absolute bottom-full left-0 z-20 mb-3 w-72 rounded-2xl bg-[#202123] p-3 shadow-2xl">
          {children}
        </div>
      ) : null}
    </div>
  );
});

// 函数名：PillMenuTitle；简单介绍：渲染菜单分组标题；参数变量名：children。
export const PillMenuTitle = React.memo(function PillMenuTitle({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="px-2 pb-2 text-sm font-semibold text-gray-100">{children}</div>;
});

// 函数名：PillMenuItem；简单介绍：渲染可点击菜单项，并根据 active 展示状态；参数变量名：active、children、onClick。
export const PillMenuItem = React.memo(function PillMenuItem({
  active,
  children,
  onClick,
}: PillMenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm font-semibold hover:bg-white/10 ${
        active ? 'text-green-300' : 'text-gray-200'
      }`}
    >
      {children}
    </button>
  );
});
