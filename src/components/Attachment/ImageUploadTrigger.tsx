'use client';

import React, { useRef } from 'react';
import { Icon } from '@iconify/react';

interface ImageUploadTriggerProps {
  onSelect: (file: File) => void;
}

/**
 * React Component: 图片上传触发器
 * 隐藏的文件输入，通过按钮触发
 */
export const ImageUploadTrigger: React.FC<ImageUploadTriggerProps> = ({
  onSelect,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    onSelect(file);

    // 清空 input 值，允许用户反复选同一张图
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="inline-flex">
      <input
        ref={fileInputRef}
        type="file"
        hidden
        accept="image/*"
        onChange={handleFileChange}
      />

      <button
        onClick={triggerFileInput}
        type="button"
        className="p-2 text-gray-400 hover:text-green-700 transition-colors flex-shrink-0"
        title="上传图片"
      >
        <Icon icon="lucide:image" className="w-5 h-5" />
      </button>
    </div>
  );
};
