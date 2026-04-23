'use client';

import React from 'react';
import { Icon } from '@iconify/react';

interface ImagePreviewProps {
  src: string;
  onRemove: () => void;
}

/**
 * React Component: 图片预览
 * 显示已选择的图片及删除按钮
 */
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
