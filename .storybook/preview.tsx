import type { Preview } from '@storybook/nextjs-vite';

import '../src/app/globals.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'vchat',
      values: [{ name: 'vchat', value: '#101113' }],
    },
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-[#101113] p-6 text-gray-100">
        <Story />
      </div>
    ),
  ],
};

export default preview;
