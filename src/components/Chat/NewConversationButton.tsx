'use client';

import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/Ui/Button';
import { useChatStore } from '@/stores/chatStore';

export function NewConversationButton() {
  const router = useRouter();
  const switchConversation = useChatStore((state) => state.switchConversation);

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
