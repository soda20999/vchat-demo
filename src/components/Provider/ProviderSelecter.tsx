'use client';

// 文件作用：渲染模型供应商和模型选择下拉框，供聊天页面选择当前 AI 模型。
import React from 'react';
import * as Select from '@radix-ui/react-select';
import { Icon } from '@iconify/react';
import type { ProviderProps } from '@/types';

interface ProviderGroupProps {
  // provider：单个模型供应商及其模型列表。
  provider: ProviderProps;
  // showSeparator：是否在该供应商分组后显示分隔线。
  showSeparator: boolean;
}

/**
 * 函数名：ProviderGroup
 * 简单介绍：渲染一个供应商分组和该供应商下的所有模型选项。
 * 参数变量名：provider、showSeparator。
 */
const ProviderGroup: React.FC<ProviderGroupProps> = React.memo(({
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
});

ProviderGroup.displayName = 'ProviderGroup';

interface ProviderSelectProps {
  // providers：可选的供应商列表。
  providers: ProviderProps[];
  // value：当前选中的模型值。
  value?: string;
  // onChange：模型变更时触发的回调函数。
  onChange?: (value: string) => void;
}

/**
 * 函数名：ProviderSelect
 * 简单介绍：提供模型选择下拉框，并按供应商进行分组展示。
 * 参数变量名：providers、value、onChange。
 */
export const ProviderSelect: React.FC<ProviderSelectProps> = React.memo(({
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
});

ProviderSelect.displayName = 'ProviderSelect';
