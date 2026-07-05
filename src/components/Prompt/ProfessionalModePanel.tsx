'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';

import { SettingNumberField } from '@/components/Ui/SettingNumberField';
import { SettingToggleRow } from '@/components/Ui/SettingToggleRow';
import { useChatStore } from '@/stores/chatStore';

type ProfessionalModePanelProps = {
  openMenu: string | null;
  setOpenMenu: (value: string | null) => void;
};

type PanelTab = 'params' | 'memory';

const RECENT_TURN_OPTIONS = [4, 8, 12];

function InfoTip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <span className="flex h-4 w-4 items-center justify-center rounded-full border border-white/25 text-[10px] font-bold text-white/70">
        !
      </span>
      <span className="pointer-events-none absolute left-1/2 bottom-full z-40 mb-2 w-44 -translate-x-1/2 rounded-lg bg-black px-3 py-2 text-xs leading-5 text-white opacity-0 shadow-xl ring-1 ring-white/10 transition-opacity group-hover:opacity-100">
        {text}
      </span>
    </span>
  );
}

function FieldLabel({ label, tip }: { label: string; tip: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-300">
      {label}
      <InfoTip text={tip} />
    </span>
  );
}

function TabButton({
  active,
  icon,
  children,
  onClick,
}: {
  active: boolean;
  icon: string;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-9 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition ${
        active ? 'bg-white text-[#202123]' : 'bg-white/8 text-gray-200 hover:bg-white/12'
      }`}
    >
      <Icon icon={icon} className="h-4 w-4" />
      {children}
    </button>
  );
}

export function ProfessionalModePanel({ openMenu, setOpenMenu }: ProfessionalModePanelProps) {
  const [tab, setTab] = useState<PanelTab>('params');
  const isOpen = openMenu === 'advanced';
  const promptSettings = useChatStore((state) => state.promptSettings);
  const contextOptions = useChatStore((state) => state.contextOptions);
  const updateSettings = useChatStore((state) => state.updatePromptSettings);
  const updateContextOptions = useChatStore((state) => state.updateContextOptions);

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setOpenMenu(isOpen ? null : 'advanced')}
        className="flex items-center gap-2 rounded-full bg-[#2f3033] px-4 py-2 text-sm font-semibold text-gray-200 hover:bg-[#3a3b3f]"
      >
        <Icon icon="lucide:cpu" className="h-4 w-4" />
        专业模式
      </button>

      {isOpen ? (
        <div className="absolute bottom-full left-0 z-30 mb-3 w-[23rem] rounded-2xl bg-[#202123] p-4 text-white shadow-2xl ring-1 ring-white/10">
          <div className="mb-4 flex gap-2">
            <TabButton
              active={tab === 'params'}
              icon="lucide:sliders-horizontal"
              onClick={() => setTab('params')}
            >
              生成参数
            </TabButton>
            <TabButton
              active={tab === 'memory'}
              icon="lucide:brain"
              onClick={() => setTab('memory')}
            >
              记忆设置
            </TabButton>
          </div>

          {tab === 'params' ? (
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <SettingNumberField
                  label="温度"
                  tip="数值越高，回答越发散。"
                  min={0}
                  max={2}
                  step={0.1}
                  value={promptSettings.temperature}
                  onChange={(temperature) => updateSettings({ temperature })}
                />
                <SettingNumberField
                  label="Top P"
                  tip="控制候选词采样范围。"
                  min={0}
                  max={1}
                  step={0.05}
                  value={promptSettings.topP}
                  onChange={(topP) => updateSettings({ topP })}
                />
              </div>

              <SettingNumberField
                label="最大 Token"
                tip="限制单次回答长度。"
                min={100}
                max={4000}
                step={100}
                value={promptSettings.maxTokens}
                onChange={(maxTokens) => updateSettings({ maxTokens })}
              />

              <label className="grid gap-1.5">
                <FieldLabel label="系统提示词" tip="定义当前会话的角色和边界。" />
                <textarea
                  aria-label="系统提示词"
                  value={promptSettings.systemPrompt}
                  onChange={(event) => updateSettings({ systemPrompt: event.target.value })}
                  rows={4}
                  className="resize-none rounded-lg border border-white/10 bg-[#101114] px-3 py-2 text-sm leading-6 text-white outline-none transition focus:border-green-500/70"
                  placeholder="输入当前会话的系统角色或约束"
                />
              </label>
            </div>
          ) : (
            <div className="grid gap-2">
              <SettingToggleRow
                label="长期记忆"
                tip="保留跨会话的重要偏好。"
                active={contextOptions.memoryEnabled}
                onClick={() =>
                  updateContextOptions({ memoryEnabled: !contextOptions.memoryEnabled })
                }
              />
              <SettingToggleRow
                label="会话摘要"
                tip="用摘要压缩较长上下文。"
                active={contextOptions.summaryEnabled}
                onClick={() =>
                  updateContextOptions({ summaryEnabled: !contextOptions.summaryEnabled })
                }
              />
              <SettingToggleRow
                label="相关历史"
                tip="召回和当前问题相关的历史。"
                active={contextOptions.relevantHistoryEnabled}
                onClick={() =>
                  updateContextOptions({
                    relevantHistoryEnabled: !contextOptions.relevantHistoryEnabled,
                  })
                }
              />

              <div className="grid gap-1.5 pt-2">
                <FieldLabel label="最近对话轮数" tip="控制随请求携带的最近聊天数量。" />
                <div className="grid grid-cols-3 gap-2">
                  {RECENT_TURN_OPTIONS.map((turns) => (
                    <button
                      key={turns}
                      type="button"
                      aria-label={`最近 ${turns} 轮`}
                      onClick={() => updateContextOptions({ recentTurns: turns })}
                      className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                        contextOptions.recentTurns === turns
                          ? 'bg-green-500 text-white'
                          : 'bg-white/5 text-gray-200 hover:bg-white/10'
                      }`}
                    >
                      {turns} 轮
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
