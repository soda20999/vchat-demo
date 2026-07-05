'use client';

import { Icon } from '@iconify/react';
import { type CSSProperties, type MouseEvent, useMemo, useRef, useState } from 'react';

import { useChatStore } from '@/stores/chatStore';

type RolePreset = {
  id: string;
  label: string;
  icon: string;
  title: string;
  description: string;
  example: string;
  colorClassName: string;
  glowClassName: string;
  systemPrompt: string;
  defaultParams: {
    temperature: number;
    topP: number;
    maxTokens: number;
  };
};

const ROLE_PRESETS: RolePreset[] = [
  {
    id: 'role-food',
    label: '饮食',
    icon: 'lucide:utensils',
    title: '饮食规划助手',
    description: '按口味、预算、时间和营养偏好给出日常饮食建议。',
    example: '例如：一周轻食安排、晚餐搭配、忌口替代方案。',
    colorClassName: 'bg-emerald-500 hover:bg-emerald-400',
    glowClassName: 'shadow-[0_0_28px_rgba(16,185,129,0.45)]',
    systemPrompt:
      '你是饮食规划助手。根据用户的口味、预算、时间、营养偏好和忌口，提供清晰实用的饮食建议。涉及疾病或治疗时提醒咨询医生。',
    defaultParams: { temperature: 0.6, topP: 0.9, maxTokens: 1000 },
  },
  {
    id: 'role-travel',
    label: '出行',
    icon: 'lucide:route',
    title: '出行规划助手',
    description: '帮助规划路线、时间、预算和备选方案，让行程更稳。',
    example: '例如：周末路线、通勤优化、旅行备选计划。',
    colorClassName: 'bg-sky-500 hover:bg-sky-400',
    glowClassName: 'shadow-[0_0_28px_rgba(14,165,233,0.45)]',
    systemPrompt:
      '你是出行规划助手。请根据用户目的地、时间、预算、交通偏好和风险点，给出路线规划、备选方案和注意事项。',
    defaultParams: { temperature: 0.5, topP: 0.9, maxTokens: 1200 },
  },
  {
    id: 'role-emotion',
    label: '情绪',
    icon: 'lucide:heart-handshake',
    title: '情绪支持助手',
    description: '用温和、稳定的方式陪伴表达，帮助梳理情绪和下一步。',
    example: '例如：压力复盘、情绪命名、低落时的行动清单。',
    colorClassName: 'bg-fuchsia-500 hover:bg-fuchsia-400',
    glowClassName: 'shadow-[0_0_28px_rgba(217,70,239,0.45)]',
    systemPrompt:
      '你是情绪支持助手。请温和、真诚、稳定地回应用户，帮助用户表达和梳理情绪，不做医学诊断，不替代专业心理咨询。',
    defaultParams: { temperature: 0.75, topP: 0.95, maxTokens: 1000 },
  },
  {
    id: 'role-study',
    label: '学习',
    icon: 'lucide:book-open-check',
    title: '学习教练',
    description: '拆解知识点、制定练习节奏，并用反馈帮助持续推进。',
    example: '例如：知识点讲解、复习计划、错题原因分析。',
    colorClassName: 'bg-amber-500 hover:bg-amber-400',
    glowClassName: 'shadow-[0_0_28px_rgba(245,158,11,0.45)]',
    systemPrompt:
      '你是学习教练。请根据用户目标、基础水平和可用时间拆解学习任务，用清晰步骤、例子和练习反馈帮助用户掌握内容。',
    defaultParams: { temperature: 0.45, topP: 0.85, maxTokens: 1400 },
  },
];

const ROLE_ANGLES = [-150, -110, -70, -30];
const ROLE_RADIUS_REM = 8;

function getRolePositionStyle(index: number): CSSProperties {
  const angle = ROLE_ANGLES[index] ?? -90;
  const radians = (angle * Math.PI) / 180;

  return {
    left: `calc(50% + ${(Math.cos(radians) * ROLE_RADIUS_REM).toFixed(2)}rem)`,
    top: `calc(50% + ${(Math.sin(radians) * ROLE_RADIUS_REM).toFixed(2)}rem)`,
  };
}

function getRolePanelTransform(index: number) {
  return index >= 2
    ? 'translate(1rem, calc(-100% - 1.25rem))'
    : 'translate(1.25rem, calc(-100% - 0.75rem))';
}

export function RoleRadialMenu() {
  const [open, setOpen] = useState(false);
  const [hoveredRoleId, setHoveredRoleId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const updatePromptSettings = useChatStore((state) => state.updatePromptSettings);
  const hoveredRoleIndex = useMemo(
    () => ROLE_PRESETS.findIndex((role) => role.id === hoveredRoleId),
    [hoveredRoleId],
  );
  const hoveredRole = hoveredRoleIndex >= 0 ? ROLE_PRESETS[hoveredRoleIndex] : undefined;

  const applyRole = (role: RolePreset) => {
    updatePromptSettings({
      templateId: role.id,
      systemPrompt: role.systemPrompt,
      ...role.defaultParams,
    });
    setOpen(false);
  };

  const handleMouseLeave = (event: MouseEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget;

    if (nextTarget instanceof Node && menuRef.current?.contains(nextTarget)) {
      return;
    }

    setHoveredRoleId(null);
  };

  return (
    <div
      ref={menuRef}
      className="relative mr-3 flex h-16 w-16 shrink-0 items-center justify-center"
      onMouseLeave={handleMouseLeave}
    >
      {hoveredRole ? (
        <div
          className="pointer-events-none absolute z-40 w-72 -translate-x-1/2 rounded-2xl bg-black px-4 py-3 text-white shadow-2xl ring-1 ring-white/10"
          style={{
            ...getRolePositionStyle(hoveredRoleIndex),
            transform: getRolePanelTransform(hoveredRoleIndex),
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full ${hoveredRole.colorClassName}`}
            >
              <Icon icon={hoveredRole.icon} className="h-4 w-4" />
            </span>
            <div className="text-base font-semibold">{hoveredRole.title}</div>
          </div>
          <div className="mt-3 text-sm leading-6 text-white/80">{hoveredRole.description}</div>
          <div className="mt-3 rounded-xl bg-white/10 px-3 py-2 text-xs leading-5 text-white/70">
            {hoveredRole.example}
          </div>
        </div>
      ) : null}

      {open
        ? ROLE_PRESETS.map((role, index) => {
            const angle = ROLE_ANGLES[index] ?? -90;

            return (
              <button
                key={role.id}
                type="button"
                aria-label={role.label}
                onClick={() => applyRole(role)}
                onMouseEnter={() => setHoveredRoleId(role.id)}
                className={`absolute left-1/2 top-1/2 z-20 flex aspect-square h-16 w-16 items-center justify-center rounded-full p-0 text-white ring-2 ring-white/80 ${role.colorClassName} ${role.glowClassName}`}
                style={{
                  transform: `translate(-50%, -50%) rotate(${angle}deg) translate(${ROLE_RADIUS_REM}rem) rotate(${-angle}deg)`,
                }}
              >
                <Icon icon={role.icon} className="h-7 w-7" aria-hidden="true" />
              </button>
            );
          })
        : null}

      <button
        type="button"
        aria-label="AI 角色"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`relative z-30 flex aspect-square shrink-0 items-center justify-center rounded-full bg-[#202123] p-0 text-white shadow-xl ring-2 ring-green-400/50 transition-[width,height,background-color] hover:bg-[#2f3033] ${
          open ? 'h-16 w-16' : 'h-12 w-12'
        }`}
      >
        <Icon icon="lucide:sparkles" className={open ? 'h-7 w-7' : 'h-5 w-5'} />
      </button>
    </div>
  );
}
