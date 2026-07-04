import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { IconButton } from '@/components/Ui/IconButton';

const meta = {
  title: 'Ui/IconButton',
  component: IconButton,
  args: {
    icon: 'lucide:settings',
    label: '设置',
  },
} satisfies Meta<typeof IconButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Ghost: Story = {};

export const Solid: Story = {
  args: {
    icon: 'lucide:send',
    label: '发送',
    variant: 'solid',
  },
};

export const Danger: Story = {
  args: {
    icon: 'lucide:log-out',
    label: '退出',
    variant: 'danger',
  },
};

export const Loading: Story = {
  args: {
    loading: true,
    label: '发送中',
    variant: 'solid',
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <IconButton icon="lucide:upload" label="小尺寸" size="sm" />
      <IconButton icon="lucide:upload" label="中尺寸" size="md" />
      <IconButton icon="lucide:upload" label="大尺寸" size="lg" />
    </div>
  ),
};
