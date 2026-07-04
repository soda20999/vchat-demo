import { Icon } from '@iconify/react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Button } from '@/components/Ui/Button';

const meta = {
  title: 'Ui/Button',
  component: Button,
  args: {
    children: '新建会话',
  },
  decorators: [
    (Story) => (
      <div className="w-56">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Active: Story = {
  args: {
    active: true,
    children: '当前会话',
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: '退出登录',
    icon: <Icon icon="lucide:log-out" />,
  },
};

export const WithSuffix: Story = {
  args: {
    icon: <Icon icon="lucide:message-square" />,
    suffix: <span className="text-[11px] text-gray-500">12</span>,
    children: '产品讨论',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: '不可用',
  },
};
