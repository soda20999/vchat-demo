'use client';

// 文件作用：封装侧边栏里的导航/列表按钮样式，支持左侧图标、右侧附加内容和选中状态。
import React from 'react';

type SidebarButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  // active：按钮是否处于当前选中状态。
  active?: boolean;
  // icon：按钮左侧图标节点。
  icon?: React.ReactNode;
  // suffix：按钮右侧附加节点。
  suffix?: React.ReactNode;
  // textClassName：按钮文本的附加样式。
  textClassName?: string;
};

// 函数名：SidebarButton；简单介绍：渲染侧边栏通用的整行导航按钮，适用于菜单项、分组入口和会话项。
export const SidebarButton = React.memo(function SidebarButton({
  active = false,
  icon,
  suffix,
  children,
  className = '',
  textClassName = '',
  ...props
}: SidebarButtonProps) {
  return (
    <button
      type="button"
      className={`flex w-full items-center justify-between gap-3 rounded-xl px-2 py-2 text-left transition-colors ${
        active
          ? 'bg-[#2a2a2a] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]'
          : 'hover:bg-[#262626]'
      } ${className}`}
      {...props}
    >
      <span className="flex min-w-0 flex-1 items-center gap-3">
        {icon ? <span className="shrink-0">{icon}</span> : null}
        <span className={`truncate text-[14px] leading-[1.35] text-[#d2d2d2] ${textClassName}`}>
          {children}
        </span>
      </span>
      {suffix ? <span className="shrink-0">{suffix}</span> : null}
    </button>
  );
});
