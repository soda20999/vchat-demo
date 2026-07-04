import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { LOCAL_PROVIDERS } from '@/config/providers';
import { ProviderSelect } from '@/components/Provider/ProviderSelecter';

const meta = {
  title: 'Business/ProviderSelect',
  component: ProviderSelect,
  args: {
    providers: LOCAL_PROVIDERS,
    value: LOCAL_PROVIDERS[0]?.models[0],
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProviderSelect>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    providers: [],
    value: undefined,
  },
};
