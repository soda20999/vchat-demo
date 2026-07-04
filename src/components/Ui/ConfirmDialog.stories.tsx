import { useState, type ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { ConfirmDialog } from './ConfirmDialog';
import { Button } from './Button';

const meta = {
  title: 'Ui/ConfirmDialog',
  component: ConfirmDialog,
  args: {
    open: true,
    title: '确认删除会话？',
    description: '删除后当前会话记录将不再显示。',
    confirmText: '删除',
    cancelText: '取消',
    variant: 'danger',
    onOpenChange: () => undefined,
    onConfirm: () => undefined,
  },
} satisfies Meta<typeof ConfirmDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

function ControlledConfirmDialog(args: ComponentProps<typeof ConfirmDialog>) {
  const [open, setOpen] = useState(true);

  return (
    <div className="w-48">
      <Button variant="danger" onClick={() => setOpen(true)}>
        打开弹窗
      </Button>
      <ConfirmDialog
        {...args}
        open={open}
        onOpenChange={setOpen}
        onConfirm={() => setOpen(false)}
      />
    </div>
  );
}

export const Danger: Story = {
  args: {},
  render: (args) => <ControlledConfirmDialog {...args} />,
};

export const Loading: Story = {
  args: {
    loading: true,
    title: '正在处理',
    description: '请求处理中，请稍等。',
    variant: 'default',
  },
};
