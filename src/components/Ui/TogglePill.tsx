'use client';

// 文件作用：渲染小型胶囊开关按钮，用于快捷切换某个选项状态。
import { Icon } from '@iconify/react';

interface TogglePillProps {
  // active：当前选项是否启用。
  active?: boolean;
  // icon：可选的 Iconify 图标名称。
  icon?: string;
  // label：按钮显示文字。
  label: string;
  // onClick：点击按钮时触发的切换函数。
  onClick: () => void;
}

/**
 * 函数名：TogglePill
 * 简单介绍：显示一个可点击的胶囊开关，并根据 active 切换视觉状态。
 * 参数变量名：active、icon、label、onClick。
 */
export function TogglePill({ active = false, icon, label, onClick }: TogglePillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition ${
        active ? 'bg-green-500/15 text-green-300' : 'bg-white/5 text-gray-400 hover:text-white'
      }`}
    >
      {icon ? <Icon icon={icon} className="h-3.5 w-3.5" /> : null}
      {label}
    </button>
  );
}
