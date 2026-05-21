'use client';

// 文件作用：渲染一个新建会话按钮，点击后切换到首页的新会话状态。
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/Ui/Button';
import { useChatStore } from '@/stores/chatStore';

// 函数名：NewConversationButton；简单介绍：创建新会话并跳转回首页。
export function NewConversationButton() {
  const router = useRouter();
  const switchConversation = useChatStore((state) => state.switchConversation);

  // handleClick：重置当前会话并导航到首页。
  const handleClick = async () => {
    await switchConversation(0);
    router.push('/');
  };

  return (
    <Button className="gap-1 justify-center" onClick={() => void handleClick()}>
      <Icon icon="lucide:plus" className="w-4 h-4" />
      <span className="text-xs">新对话</span>
    </Button>
  );
}
