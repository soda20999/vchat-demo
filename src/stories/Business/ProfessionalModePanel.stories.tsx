import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { ProfessionalModePanel } from '@/components/Prompt/ProfessionalModePanel';

const meta = {
  title: 'Business/ProfessionalModePanel',
  component: ProfessionalModePanel,
  args: {
    openMenu: 'advanced',
    setOpenMenu: () => undefined,
  },
  decorators: [
    (Story) => (
      <div className="flex min-h-96 items-end p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProfessionalModePanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Open: Story = {};
