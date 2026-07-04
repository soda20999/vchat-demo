import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { ErrorState } from '@/components/Ui/ErrorState';

const meta = {
  title: 'Ui/ErrorState',
  component: ErrorState,
  args: {
    title: '加载失败',
    description: '当前内容暂时无法加载，请稍后重试。',
  },
} satisfies Meta<typeof ErrorState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithActions: Story = {
  args: {
    action: { label: '重试', onClick: () => undefined },
    secondaryAction: { label: '返回', onClick: () => undefined },
  },
};

export const Compact: Story = {
  args: {
    compact: true,
    action: { label: '重新加载', onClick: () => undefined },
  },
};
