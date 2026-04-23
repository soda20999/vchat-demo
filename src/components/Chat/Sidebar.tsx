'use client';

import { Icon } from '@iconify/react';
import Link from 'next/link';
import React, { useState } from 'react';

import { ConversationList } from '@/components/Chat/ConversationList';
import { useChatStore } from '@/stores/chatStore';

const NOTEBOOK_ITEMS = ['Linux Command Reference: Clear', '新建笔记本'];

const ACTIONS = [
  { icon: 'lucide:square-pen', label: '发起新对话', action: 'new-chat' as const },
  { icon: 'lucide:badge-star', label: '我的内容' },
];

export function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const switchConversation = useChatStore((state) => state.switchConversation);

  const handleNewConversation = async () => {
    await switchConversation(0);
  };

  return (
    <aside
      className={`relative h-full border-r border-[#2a2a2a] bg-[#1f1f1f] text-[#d6d6d6] transition-[width] duration-300 ease-out ${
        expanded ? 'w-[322px]' : 'w-[76px]'
      }`}
    >
      <div
        className={`flex h-full flex-col ${
          expanded ? 'px-5 py-4' : 'items-center px-0 py-3'
        }`}
      >
        <div className={`flex items-center ${expanded ? 'justify-between' : 'justify-center'}`}>
          <div className="group relative">
            <button
              type="button"
              aria-label={expanded ? '收起菜单' : '展开菜单'}
              onClick={() => setExpanded((value) => !value)}
              className={`flex shrink-0 items-center justify-center rounded-full text-[#d4d4d4] transition-colors hover:text-white ${
                expanded ? 'h-9 w-9' : 'h-10 w-10 bg-[#2b2b2b]'
              }`}
            >
              <Icon icon="lucide:menu" className="h-6 w-6" />
            </button>

            {!expanded ? (
              <div className="pointer-events-none absolute left-0 top-full z-20 mt-3 rounded-[6px] bg-white px-3 py-1.5 text-[13px] font-medium whitespace-nowrap text-[#4a4a4a] opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100">
                展开菜单
              </div>
            ) : null}
          </div>

          {expanded ? (
            <button
              type="button"
              aria-label="搜索"
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#d4d4d4] transition-colors hover:text-white"
            >
              <Icon icon="lucide:search" className="h-5 w-5" />
            </button>
          ) : null}
        </div>

        {expanded ? (
          <>
            <div className="mt-7 space-y-1.5">
              {ACTIONS.map((item) => {
                const content = (
                  <>
                    <Icon icon={item.icon} className="h-5 w-5 shrink-0 text-[#d4d4d4]" />
                    <span className="text-[16px] font-semibold tracking-[-0.01em]">
                      {item.label}
                    </span>
                  </>
                );

                if (item.action === 'new-chat') {
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => void handleNewConversation()}
                      className="flex w-full items-center gap-4 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-[#262626]"
                    >
                      {content}
                    </button>
                  );
                }

                return (
                  <button
                    key={item.label}
                    type="button"
                    className="flex w-full items-center gap-4 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-[#262626]"
                  >
                    {content}
                  </button>
                );
              })}
            </div>

            <div className="mt-7">
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-[#262626]"
              >
                <span className="text-[16px] font-semibold text-[#ececec]">笔记本</span>
                <Icon icon="lucide:chevron-right" className="h-4 w-4 text-[#acacac]" />
              </button>

              <div className="mt-2.5 space-y-1">
                <button
                  type="button"
                  className="flex w-full items-center gap-4 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-[#262626]"
                >
                  <Icon icon="lucide:notebook-text" className="h-5 w-5 shrink-0 text-[#d4d4d4]" />
                  <span className="truncate text-[15px] font-medium text-[#d2d2d2]">
                    {NOTEBOOK_ITEMS[0]}
                  </span>
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-4 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-[#262626]"
                >
                  <Icon icon="lucide:plus" className="h-5 w-5 shrink-0 text-[#d4d4d4]" />
                  <span className="text-[15px] font-medium text-[#d2d2d2]">
                    {NOTEBOOK_ITEMS[1]}
                  </span>
                </button>
              </div>
            </div>

            <div className="mt-7">
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-[#262626]"
              >
                <span className="text-[16px] font-semibold text-[#ececec]">Gem</span>
                <Icon icon="lucide:chevron-right" className="h-4 w-4 text-[#acacac]" />
              </button>
            </div>

            <div className="mt-7 flex min-h-0 flex-1 flex-col">
              <h2 className="px-2.5 text-[16px] font-semibold text-[#ececec]">对话</h2>
              <div className="mt-2.5 min-h-0 flex-1">
                <ConversationList />
              </div>
            </div>
          </>
        ) : (
          <div className="mt-9 flex flex-1 flex-col items-center">
            <button
              type="button"
              aria-label="发起新对话"
              onClick={() => void handleNewConversation()}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-[#d4d4d4] transition-colors hover:bg-[#2a2a2a] hover:text-white"
            >
              <Icon icon="lucide:square-pen" className="h-5 w-5" />
            </button>

            <div className="mt-auto mb-4 flex flex-col items-center gap-4">
              <Link
                href="/settings"
                aria-label="设置"
                className="relative flex h-10 w-10 items-center justify-center rounded-xl text-[#d4d4d4] transition-colors hover:bg-[#2a2a2a] hover:text-white"
              >
                <Icon icon="lucide:settings" className="h-5 w-5" />
                <span className="absolute -right-1 top-0 h-2.5 w-2.5 rounded-full bg-[#8fb2ff]" />
              </Link>
            </div>
          </div>
        )}

        {expanded ? (
          <div className="pt-3">
            <Link
              href="/settings"
              aria-label="设置"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl text-[#d4d4d4] transition-colors hover:bg-[#2a2a2a] hover:text-white"
            >
              <Icon icon="lucide:settings" className="h-5 w-5" />
              <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-[#8fb2ff]" />
            </Link>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
