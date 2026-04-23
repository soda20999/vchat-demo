'use client';

import React, { useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { ImagePreview } from '../Attachment/ImagePreview';
import { ImageUploadTrigger } from '../Attachment/ImageUploadTrigger';
import { useImageHandling } from '@/hooks/useImageHandling';

interface MessageInputProps {
  selectedModel?: string;
  conversationId?: number;
  onSend?: (payload: { content: string; image?: string }) => Promise<void>;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  selectedModel,
  conversationId,
  onSend,
}) => {
  const [inputText, setInputText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { selectedFile, previewUrl, handleImageSelect, clearImage } =
    useImageHandling();

  const canSend =
    Boolean(selectedModel) &&
    (Boolean(inputText.trim()) || Boolean(selectedFile)) &&
    !isUploading;

  const handleEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }
  };

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    });

  const sendMessage = async () => {
    const content = inputText.trim();
    if (!selectedModel || (!content && !selectedFile)) return;

    setInputText('');
    clearImage();
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    setIsUploading(true);
    let finalImageUrl: string | undefined;

    try {
      if (selectedFile) {
        finalImageUrl = await fileToDataUrl(selectedFile);
      }

      if (onSend) {
        await onSend({ content, image: finalImageUrl });
      }
    } catch (error) {
      console.error('Send message failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4">
      {previewUrl ? <ImagePreview src={previewUrl} onRemove={clearImage} /> : null}

      <div className="flex items-end rounded-[32px] border border-gray-200 bg-gray-50 px-4 py-1.5 shadow-sm transition-colors duration-200 focus-within:border-green-700 focus-within:bg-white">
        <ImageUploadTrigger onSelect={handleImageSelect} />

        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            adjustHeight();
          }}
          onKeyDown={handleEnter}
          placeholder={selectedModel ? '输入消息或上传图片...' : '请先选择模型'}
          rows={1}
          className="min-h-[40px] max-h-[160px] flex-1 resize-none overflow-y-auto border-none bg-transparent px-2 py-2 leading-6 text-gray-700 outline-none placeholder-gray-400"
          data-conversation-id={conversationId}
        />

        <button
          onClick={() => void sendMessage()}
          disabled={!canSend}
          className={`mb-1.5 rounded-full p-2 transition-all duration-200 ${
            canSend
              ? 'cursor-pointer bg-green-700 text-white hover:bg-green-800'
              : 'cursor-default bg-gray-200 text-gray-400'
          }`}
        >
          {isUploading ? (
            <Icon icon="line-md:loading-loop" className="h-4 w-4" />
          ) : (
            <Icon icon="radix-icons:paper-plane" className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
};
