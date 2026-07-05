import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { RoleRadialMenu } from '@/components/Chat/RoleRadialMenu';

const meta = {
  title: 'Business/RoleRadialMenu',
  component: RoleRadialMenu,
  decorators: [
    (Story) => (
      <div className="flex min-h-80 items-end rounded-2xl bg-gray-50 p-10">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RoleRadialMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
