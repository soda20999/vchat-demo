import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { FormField } from './FormField';

const inputClassName =
  'w-full rounded-lg border border-white/10 bg-[#202123] px-3 py-2 text-sm text-gray-100 outline-none transition focus:border-green-500/60';

const meta = {
  title: 'Ui/FormField',
  component: FormField,
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FormField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithHint: Story = {
  args: {
    label: '系统提示词',
    hint: '用于约束当前会话的回复风格。',
    labelClassName: 'mb-2 block text-sm font-medium text-gray-200',
    children: <textarea className={`${inputClassName} min-h-24`} defaultValue="你是一个助手。" />,
  },
};

export const WithError: Story = {
  args: {
    label: '邮箱',
    error: '请输入有效邮箱',
    labelClassName: 'mb-2 block text-sm font-medium text-gray-200',
    children: <input className={inputClassName} defaultValue="demo" />,
  },
};
