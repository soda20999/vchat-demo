'use client';

import React, { useRef } from 'react';

import { IconButton } from '@/components/Ui/IconButton';

interface ImageUploadTriggerProps {
  onSelect: (file: File) => void;
}

export const ImageUploadTrigger: React.FC<ImageUploadTriggerProps> = ({ onSelect }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    onSelect(file);
    event.target.value = '';
  };

  return (
    <div className="inline-flex">
      <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={handleFileChange} />
      <IconButton
        icon="lucide:image"
        label="上传图片"
        onClick={() => fileInputRef.current?.click()}
      />
    </div>
  );
};
