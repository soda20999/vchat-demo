'use client';

// 文件作用：渲染已选择图片的缩略预览，并提供移除图片按钮。
import React from 'react';
import { Icon } from '@iconify/react';

interface ImagePreviewProps {
  // src：图片预览地址。
  src: string;
  // onRemove：点击删除按钮时触发的移除回调。
  onRemove: () => void;
}

/**
 * React Component: 图片预览
 * 显示已选择的图片及删除按钮
 */
// 函数名：ImagePreview；简单介绍：展示图片缩略图和删除按钮；参数变量名：src、onRemove。
export const ImagePreview: React.FC<ImagePreviewProps> = ({ src, onRemove }) => {
  return (
    <div className="relative inline-block mb-2">
      <img
        src={src}
        alt="preview"
        className="w-20 h-20 object-cover rounded-xl border border-gray-200 shadow-sm"
      />
      <button
        onClick={onRemove}
        className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full p-1 hover:bg-red-500 transition-colors shadow-md"
      >
        <Icon icon="lucide:x" className="w-3 h-3" />
      </button>
    </div>
  );
};
