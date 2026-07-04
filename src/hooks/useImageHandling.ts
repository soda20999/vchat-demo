/**
 * React Hook: 图片处理和预览管理
 * 管理图片选择、预览 URL、内存释放
 */

import { useState, useEffect, useCallback } from 'react';

interface UseImageHandlingReturn {
  selectedFile: File | null;
  previewUrl: string | null;
  handleImageSelect: (file: File) => void;
  clearImage: () => void;
}

export function useImageHandling(): UseImageHandlingReturn {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  /**
   * 处理图片选择并生成预览 URL
   */
  const handleImageSelect = useCallback(
    (file: File) => {
      // 清理旧的 URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      // 设置新的文件和预览 URL
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    },
    [previewUrl],
  );

  /**
   * 清除图片并释放内存
   */
  const clearImage = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
  }, [previewUrl]);

  /**
   * 组件卸载时自动清理，防止内存泄漏
   */
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return {
    selectedFile,
    previewUrl,
    handleImageSelect,
    clearImage,
  };
}
