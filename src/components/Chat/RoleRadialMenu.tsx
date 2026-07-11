'use client';

import { Icon } from '@iconify/react';
import { type CSSProperties, type MouseEvent, useEffect, useMemo, useRef, useState } from 'react';

import { ROLE_PRESETS, type RolePreset } from '@/config/assistant-roles';
import { useChatStore } from '@/stores/chatStore';

const ROLE_ANGLES = [-150, -110, -70, -30];
const ROLE_RADIUS_REM = 8;
const roleSelectionByConversation = new Map<string, string>();
const DEFAULT_PROMPT_SETTINGS = {
  templateId: '',
  systemPrompt: '',
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 1200,
};

type RoleRadialMenuProps = {
  conversationId?: number;
};

function getConversationKey(conversationId?: number) {
  return String(conversationId ?? 'new');
}

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

export function RoleRadialMenu({ conversationId }: RoleRadialMenuProps) {
  const [open, setOpen] = useState(false);
  const [hoveredRoleId, setHoveredRoleId] = useState<string | null>(null);
  const conversationKey = getConversationKey(conversationId);
  const [localSelection, setLocalSelection] = useState(() => ({
    key: conversationKey,
    roleId: roleSelectionByConversation.get(conversationKey) ?? null,
  }));
  const previousConversationKeyRef = useRef(conversationKey);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const updatePromptSettings = useChatStore((state) => state.updatePromptSettings);
  const selectedRoleId =
    localSelection.key === conversationKey
      ? localSelection.roleId
      : (roleSelectionByConversation.get(conversationKey) ?? null);
  const hoveredRoleIndex = useMemo(
    () => ROLE_PRESETS.findIndex((role) => role.id === hoveredRoleId),
    [hoveredRoleId],
  );
  const hoveredRole = hoveredRoleIndex >= 0 ? ROLE_PRESETS[hoveredRoleIndex] : undefined;
  const selectedRole = ROLE_PRESETS.find((role) => role.id === selectedRoleId);

  useEffect(() => {
    const storedRoleId = roleSelectionByConversation.get(conversationKey) ?? null;
    const storedRole = ROLE_PRESETS.find((role) => role.id === storedRoleId);
    const changedConversation = previousConversationKeyRef.current !== conversationKey;

    if (storedRole) {
      updatePromptSettings({
        templateId: storedRole.id,
        systemPrompt: storedRole.systemPrompt,
        ...storedRole.defaultParams,
      });
    } else if (changedConversation) {
      updatePromptSettings(DEFAULT_PROMPT_SETTINGS);
    }
    previousConversationKeyRef.current = conversationKey;
  }, [conversationKey, updatePromptSettings]);

  const applyRole = (role: RolePreset) => {
    roleSelectionByConversation.set(conversationKey, role.id);
    setLocalSelection({ key: conversationKey, roleId: role.id });
    updatePromptSettings({
      templateId: role.id,
      systemPrompt: role.systemPrompt,
      ...role.defaultParams,
    });
    setOpen(false);
  };

  const resetRole = () => {
    roleSelectionByConversation.delete(conversationKey);
    setLocalSelection({ key: conversationKey, roleId: null });
    setHoveredRoleId(null);
    updatePromptSettings(DEFAULT_PROMPT_SETTINGS);
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
            const selected = selectedRoleId === role.id;

            return (
              <button
                key={role.id}
                type="button"
                aria-label={selected ? '默认角色' : role.label}
                data-testid={selected ? 'role-option-default' : `role-option-${role.id}`}
                onClick={() => (selected ? resetRole() : applyRole(role))}
                onMouseEnter={() => setHoveredRoleId(selected ? null : role.id)}
                className={`absolute left-1/2 top-1/2 z-20 flex aspect-square h-16 w-16 items-center justify-center rounded-full p-0 text-white ring-2 ring-white/80 ${
                  selected
                    ? 'bg-[#202123] shadow-xl hover:bg-[#2f3033]'
                    : `${role.colorClassName} ${role.glowClassName}`
                }`}
                style={{
                  transform: `translate(-50%, -50%) rotate(${angle}deg) translate(${ROLE_RADIUS_REM}rem) rotate(${-angle}deg)`,
                }}
              >
                <Icon
                  icon={selected ? 'lucide:sparkles' : role.icon}
                  className="h-7 w-7"
                  aria-hidden="true"
                />
              </button>
            );
          })
        : null}

      <button
        type="button"
        aria-label="AI 角色"
        aria-expanded={open}
        data-testid="role-menu-trigger"
        onClick={() => setOpen((value) => !value)}
        className={`relative z-30 flex aspect-square shrink-0 items-center justify-center rounded-full p-0 text-white shadow-xl ring-2 transition-[width,height,background-color] ${
          selectedRole
            ? `${selectedRole.colorClassName} ${selectedRole.glowClassName} ring-white/80`
            : 'bg-[#202123] ring-green-400/50 hover:bg-[#2f3033]'
        } ${open ? 'h-16 w-16' : 'h-12 w-12'}`}
      >
        <Icon
          icon={selectedRole?.icon ?? 'lucide:sparkles'}
          className={open ? 'h-7 w-7' : 'h-5 w-5'}
        />
      </button>
    </div>
  );
}
