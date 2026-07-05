import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import { SidebarSettingsMenu } from '@/components/Chat/SidebarSettingsMenu';
import { SidebarToggleButton } from '@/components/Chat/SidebarToggleButton';

const meta = {
  title: 'Business/SidebarParts',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;

export const ToggleCollapsed: StoryObj = {
  render: () => <SidebarToggleButton expanded={false} onToggle={fn()} />,
};

export const ToggleExpanded: StoryObj = {
  render: () => <SidebarToggleButton expanded onToggle={fn()} />,
};

export const SettingsMenu: StoryObj = {
  render: () => (
    <div className="relative h-40 w-72 bg-[#1f1f1f] p-4">
      <SidebarSettingsMenu open expanded loggingOut={false} errorMessage="" onLogout={fn()} />
    </div>
  ),
};

export const SettingsMenuWithError: StoryObj = {
  render: () => (
    <div className="relative h-52 w-72 bg-[#1f1f1f] p-4">
      <SidebarSettingsMenu
        open
        expanded
        loggingOut={false}
        errorMessage="登出失败，请稍后重试"
        onLogout={fn()}
      />
    </div>
  ),
};
