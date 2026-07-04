import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { MessageBubble } from '@/components/Chat/MessageBubble';

const now = new Date('2026-07-04T08:30:00.000Z');

const meta = {
  title: 'Business/MessageBubble',
  component: MessageBubble,
  decorators: [
    (Story) => (
      <div className="max-w-3xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MessageBubble>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Question: Story = {
  args: {
    message: {
      id: 1,
      type: 'question',
      status: 'finished',
      content: '帮我总结一下今天的任务。',
      conversationId: 1,
      createdAt: now,
    },
  },
};

export const Answer: Story = {
  args: {
    message: {
      id: 2,
      type: 'answer',
      status: 'finished',
      content: '可以。今天优先完成组件工程化、Storybook 状态文档和类型边界整理。',
      conversationId: 1,
      createdAt: now,
    },
  },
};

export const Loading: Story = {
  args: {
    message: {
      id: 3,
      type: 'answer',
      status: 'loading',
      content: '',
      conversationId: 1,
      createdAt: now,
    },
  },
};

export const Error: Story = {
  args: {
    message: {
      id: 4,
      type: 'answer',
      status: 'error',
      content: '已经生成的内容会保留。',
      conversationId: 1,
      createdAt: now,
    },
  },
};
