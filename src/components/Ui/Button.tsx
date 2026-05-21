'use client';

// 文件作用：封装项目通用按钮样式，支持图标、尾部内容和激活状态。
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  // active：按钮是否处于激活状态。
  active?: boolean;
  // icon：按钮左侧图标节点。
  icon?: React.ReactNode;
  // suffix：按钮右侧附加节点。
  suffix?: React.ReactNode;
}

/**
 * React Component: 通用按钮
 * 支持活跃状态显示
 */
// 函数名：Button；简单介绍：渲染统一样式的按钮，并透传原生 button 属性；参数变量名：active、icon、suffix、children、className。
export const Button: React.FC<ButtonProps> = ({
  active = false,
  icon,
  suffix,
  children,
  className = '',
  ...props
}) => {
  const baseClasses =
    'w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 active:scale-95 group';
  const colorClasses = active
    ? 'bg-blue-600 text-white'
    : 'bg-gray-300 text-gray-800 hover:bg-gray-400';

  return (
    <button className={`${baseClasses} ${colorClasses} ${className}`} {...props}>
      <div className="flex items-center gap-2 overflow-hidden">
        {icon && (
          <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
            {icon}
          </div>
        )}
        <span className="text-xs font-medium truncate">{children}</span>
      </div>
      {suffix && <div>{suffix}</div>}
    </button>
  );
};
