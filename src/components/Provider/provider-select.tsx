'use client';

import React from 'react';
import * as Select from '@radix-ui/react-select';
import { Icon } from '@iconify/react';
import type { ProviderProps } from '@/types';

interface ProviderGroupProps {
  provider: ProviderProps;
  showSeparator: boolean;
}

const ProviderGroup: React.FC<ProviderGroupProps> = ({
  provider,
  showSeparator,
}) => {
  return (
    <div>
      <Select.Group>
        <Select.Label className="flex h-7 items-center px-6 text-gray-500">
          {provider.title || provider.name}
        </Select.Label>

        {provider.models.map((model) => (
          <Select.Item
            key={model}
            value={model}
            className="relative flex h-9 cursor-pointer items-center rounded px-6 text-green-700 outline-none data-[highlighted]:bg-green-700 data-[highlighted]:text-white"
          >
            <Select.ItemIndicator className="absolute left-2 w-6">
              <Icon icon="radix-icons:check" className="h-4 w-4" />
            </Select.ItemIndicator>
            <Select.ItemText>{model}</Select.ItemText>
          </Select.Item>
        ))}
      </Select.Group>

      {showSeparator ? <Select.Separator className="my-1 h-px bg-gray-100" /> : null}
    </div>
  );
};

interface ProviderSelectProps {
  providers: ProviderProps[];
  value?: string;
  onChange?: (value: string) => void;
}

export const ProviderSelect: React.FC<ProviderSelectProps> = ({
  providers,
  value,
  onChange,
}) => {
  return (
    <div className="w-full">
      <Select.Root value={value} onValueChange={onChange}>
        <Select.Trigger className="flex w-full items-center justify-between rounded-md border px-3 py-2 outline-none shadow-sm data-[placeholder]:text-gray-400">
          <Select.Value placeholder="选择模型" />
          <Select.Icon>
            <Icon icon="radix-icons:chevron-down" className="h-5 w-5" />
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content
            position="popper"
            sideOffset={8}
            className="z-[100] min-w-[var(--radix-select-trigger-width)] rounded-md border bg-white shadow-md"
          >
            <Select.Viewport className="p-2">
              {providers.map((provider, index) => (
                <ProviderGroup
                  key={provider.id}
                  provider={provider}
                  showSeparator={index !== providers.length - 1}
                />
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
};
