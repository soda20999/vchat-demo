'use client';

// 文件作用：渲染聊天底部输入框，负责文本输入、图片选择、快捷面板和发送消息。
import React, { useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { ImagePreview } from '../Attachment/ImagePreview';
import { ImageUploadTrigger } from '../Attachment/ImageUploadTrigger';
import { ContextStatusBar } from './ContextStatusBar';
import { PromptPanel } from '../Prompt/PromptPanel';
import { useImageHandling } from '@/hooks/useImageHandling';

interface MessageInputProps {
  // selectedModel：当前选中的模型名称，未选择时禁止发送。
  selectedModel?: string;
  // conversationId：当前会话 ID，用于标记输入框归属。
  conversationId?: number;
  // onSend：提交消息时调用的回调，包含文本 content 和可选图片 image。
  onSend?: (payload: { content: string; image?: string }) => Promise<void>;
}

/**
 * 函数名：MessageInput
 * 简单介绍：管理用户输入内容和图片附件，并在满足条件时发送消息。
 * 参数变量名：selectedModel、conversationId、onSend。
 */
export const MessageInput: React.FC<MessageInputProps> = React.memo(
  ({ selectedModel, conversationId, onSend }) => {
    const [inputText, setInputText] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const { selectedFile, previewUrl, handleImageSelect, clearImage } = useImageHandling();

    const canSend =
      Boolean(selectedModel) &&
      (Boolean(inputText.trim()) || Boolean(selectedFile)) &&
      !isUploading;

    // handleEnter：监听回车键，Enter 发送，Shift+Enter 换行。
    const handleEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        void sendMessage();
      }
    };

    // adjustHeight：根据文本内容自动调整输入框高度。
    const adjustHeight = () => {
      const el = textareaRef.current;
      if (el) {
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
      }
    };

    // fileToDataUrl：把图片文件转换成 base64 Data URL，便于随消息提交。
    const fileToDataUrl = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.readAsDataURL(file);
      });

    // sendMessage：校验输入内容，整理图片数据，并调用外部发送回调。
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
      <div className="mx-auto w-full max-w-3xl px-4">
        <div className="mb-3 flex items-center gap-3">
          <PromptPanel openMenu={openMenu} setOpenMenu={setOpenMenu} />
          <ContextStatusBar openMenu={openMenu} setOpenMenu={setOpenMenu} />
        </div>
        {previewUrl ? <ImagePreview src={previewUrl} onRemove={clearImage} /> : null}

        <div className="flex items-end rounded-[28px] border border-gray-200 bg-gray-50 px-4 py-2.5 shadow-sm transition-colors duration-200 focus-within:border-green-700 focus-within:bg-white">
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
            rows={2}
            className="min-h-[56px] max-h-[180px] flex-1 resize-none overflow-y-auto border-none bg-transparent px-2 py-2 leading-6 text-gray-700 outline-none placeholder-gray-400"
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
  },
);

MessageInput.displayName = 'MessageInput';
