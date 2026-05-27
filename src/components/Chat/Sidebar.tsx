'use client';

// 文件作用：渲染应用左侧导航栏，包含折叠菜单、新建会话、会话列表和设置入口。
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState } from 'react';

import { ConversationList } from '@/components/Chat/ConversationList';
import { SidebarButton } from '@/components/Ui/SidebarButton';
import { useChatStore } from '@/stores/chatStore';

const NOTEBOOK_ITEMS = ['Linux Command Reference: Clear', '新建笔记本'];

const ACTIONS = [
  { icon: 'lucide:square-pen', label: '发起新对话', action: 'new-chat' as const },
  { icon: 'lucide:badge-star', label: '我的内容' },
];

// 函数名：Sidebar；简单介绍：根据当前路由和展开状态渲染侧边栏，并提供新建会话入口。
export function Sidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const switchConversation = useChatStore((state) => state.switchConversation);

  if (pathname === '/auth') return null;

  // handleNewConversation：切换到临时新会话，用于开始一段新的聊天。
  const handleNewConversation = async () => {
    await switchConversation(0);
  };

  return (
    <aside
      className={`relative h-full border-r border-[#2a2a2a] bg-[#1f1f1f] text-[#d6d6d6] transition-[width] duration-300 ease-out ${
        expanded ? 'w-[286px]' : 'w-[64px]'
      }`}
    >
      <div
        className={`flex h-full flex-col ${
          expanded ? 'px-4 py-3' : 'items-center px-0 py-2.5'
        }`}
      >
        <div className={`flex items-center ${expanded ? 'justify-between' : 'justify-center'}`}>
          <div className="group relative">
            <button
              type="button"
              aria-label={expanded ? '收起菜单' : '展开菜单'}
              onClick={() => setExpanded((value) => !value)}
              className={`flex shrink-0 items-center justify-center rounded-full text-[#d4d4d4] transition-colors hover:text-white ${
                expanded ? 'h-8 w-8' : 'h-9 w-9 bg-[#2b2b2b]'
              }`}
            >
              <Icon icon="lucide:menu" className="h-5 w-5" />
            </button>

            {!expanded ? (
              <div className="pointer-events-none absolute left-0 top-full z-20 mt-3 rounded-[6px] bg-white px-3 py-1.5 text-[12px] font-medium whitespace-nowrap text-[#4a4a4a] opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100">
                展开菜单
              </div>
            ) : null}
          </div>

          {expanded ? (
            <button
              type="button"
              aria-label="搜索"
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#d4d4d4] transition-colors hover:text-white"
            >
              <Icon icon="lucide:search" className="h-4.5 w-4.5" />
            </button>
          ) : null}
        </div>

        {expanded ? (
          <>
            <div className="mt-5 space-y-1">
              {ACTIONS.map((item) => {
                if (item.action === 'new-chat') {
                  return (
                    <SidebarButton
                      key={item.label}
                      icon={<Icon icon={item.icon} className="h-4.5 w-4.5 text-[#d4d4d4]" />}
                      onClick={() => void handleNewConversation()}
                      textClassName="font-semibold tracking-[-0.01em] text-[#d6d6d6]"
                    >
                      {item.label}
                    </SidebarButton>
                  );
                }

                return (
                  <SidebarButton
                    key={item.label}
                    icon={<Icon icon={item.icon} className="h-4.5 w-4.5 text-[#d4d4d4]" />}
                    textClassName="font-semibold tracking-[-0.01em] text-[#d6d6d6]"
                  >
                    {item.label}
                  </SidebarButton>
                );
              })}
            </div>

            <div className="mt-5">
              <SidebarButton
                suffix={<Icon icon="lucide:chevron-right" className="h-3.5 w-3.5 text-[#acacac]" />}
                className="py-1.5"
                textClassName="font-semibold text-[#ececec]"
              >
                笔记本
              </SidebarButton>

              <div className="mt-2 space-y-0.5">
                <SidebarButton
                  icon={<Icon icon="lucide:notebook-text" className="h-4.5 w-4.5 text-[#d4d4d4]" />}
                  textClassName="font-medium"
                >
                  {NOTEBOOK_ITEMS[0]}
                </SidebarButton>
                <SidebarButton
                  icon={<Icon icon="lucide:plus" className="h-4.5 w-4.5 text-[#d4d4d4]" />}
                  textClassName="font-medium"
                >
                  {NOTEBOOK_ITEMS[1]}
                </SidebarButton>
              </div>
            </div>

            <div className="mt-5 flex min-h-0 flex-1 flex-col">
              <h2 className="px-2 text-[14px] font-semibold text-[#ececec]">对话</h2>
              <div className="mt-2 min-h-0 flex-1">
                <ConversationList />
              </div>
            </div>
          </>
        ) : (
          <div className="mt-8 flex flex-1 flex-col items-center">
            <button
              type="button"
              aria-label="发起新对话"
              onClick={() => void handleNewConversation()}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-[#d4d4d4] transition-colors hover:bg-[#2a2a2a] hover:text-white"
            >
              <Icon icon="lucide:square-pen" className="h-4.5 w-4.5" />
            </button>

            <div className="mb-3 mt-auto flex flex-col items-center gap-3">
              <Link
                href="/settings"
                aria-label="设置"
                className="relative flex h-9 w-9 items-center justify-center rounded-xl text-[#d4d4d4] transition-colors hover:bg-[#2a2a2a] hover:text-white"
              >
                <Icon icon="lucide:settings" className="h-4.5 w-4.5" />
                <span className="absolute -right-1 top-0 h-2.5 w-2.5 rounded-full bg-[#8fb2ff]" />
              </Link>
            </div>
          </div>
        )}

        {expanded ? (
          <div className="pt-2.5">
            <Link
              href="/settings"
              aria-label="设置"
              className="relative flex h-9 w-9 items-center justify-center rounded-xl text-[#d4d4d4] transition-colors hover:bg-[#2a2a2a] hover:text-white"
            >
              <Icon icon="lucide:settings" className="h-4.5 w-4.5" />
              <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-[#8fb2ff]" />
            </Link>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
