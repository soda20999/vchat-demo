'use client';

// 文件作用：封装图片上传入口，通过按钮触发隐藏的文件选择框。
import React, { useRef } from 'react';
import { Icon } from '@iconify/react';

interface ImageUploadTriggerProps {
  // onSelect：用户选择图片文件后的回调函数。
  onSelect: (file: File) => void;
}

/**
 * React Component: 图片上传触发器
 * 隐藏的文件输入，通过按钮触发
 */
// 函数名：ImageUploadTrigger；简单介绍：触发本地图片选择，并把选中的 File 传给父组件；参数变量名：onSelect。
export const ImageUploadTrigger: React.FC<ImageUploadTriggerProps> = ({
  onSelect,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // triggerFileInput：主动点击隐藏的 input[type=file]。
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // handleFileChange：读取用户选择的第一张图片并通知父组件。
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
