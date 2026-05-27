'use client';

import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';

type Mode = 'login' | 'register';
type NoticeKind = 'error' | 'success';

type Notice = {
  kind: NoticeKind;
  text: string;
};

type ApiResponse = {
  code?: number;
  message?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TEXT = {
  brandMeta: 'AI 对话工作台',
  proxyProtected: 'Proxy 已保护',
  username: '用户名',
  email: '邮箱',
  password: '密码',
  usernamePlaceholder: '例如：vchat_user',
  emailPlaceholder: 'you@example.com',
  signInTab: '登录',
  registerTab: '注册',
  passwordLoginHint: '输入你的登录密码',
  passwordRegisterHint: '至少 6 位字符',
  usernameRequired: '用户名至少需要 2 个字符',
  emailRequired: '请输入邮箱',
  emailInvalid: '请输入有效邮箱',
  passwordRequired: '请输入密码',
  passwordTooShort: '密码至少需要 6 位字符',
  requestFailed: '请求失败，请稍后再试',
  registerSuccess: '注册成功，请使用新账号登录',
  workspaceTitle: '今日工作台',
  workspaceSubtitle: '会话、模型和提示词已准备好',
  online: '在线',
  quickStart: '快速开始',
  activeModel: '当前模型',
  assistantTitle: '智能对话助手',
  assistantDesc: '保留上下文，按你的节奏回复',
  panelNote: '登录后直接进入聊天，不经过营销页。你的会话入口、设置和模型选择都在应用壳里。',
  footer: '登录即进入受保护的 VChat 应用空间。',
};

const QUICK_ACTIONS = [
  '安排今天',
  '润色表达',
  '整理想法',
  '继续会话',
];

const MODE_COPY = {
  login: {
    eyebrow: 'Welcome back',
    title: '登录 VChat',
    description: '回到你的 AI 对话工作台，继续整理想法、计划和灵感。',
    submit: '登录',
    loading: '正在登录...',
  },
  register: {
    eyebrow: 'Create account',
    title: '创建账号',
    description: '用一个轻量账号保存你的会话、模型选择和个人提示词。',
    submit: '注册',
    loading: '正在注册...',
  },
} satisfies Record<
  Mode,
  {
    eyebrow: string;
    title: string;
    description: string;
    submit: string;
    loading: string;
  }
>;

async function readApiResponse(response: Response): Promise<ApiResponse> {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text) as ApiResponse;
  } catch {
    return { message: text };
  }
}

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(false);

  const copy = MODE_COPY[mode];
  const passwordHint = useMemo(
    () => mode === 'register' ? TEXT.passwordRegisterHint : TEXT.passwordLoginHint,
    [mode]
  );

  const switchMode = (nextMode: Mode) => {
    if (loading || nextMode === mode) return;
    setMode(nextMode);
    setNotice(null);
  };

  const validate = () => {
    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();

    if (mode === 'register' && trimmedUsername.length < 2) {
      return TEXT.usernameRequired;
    }

    if (!trimmedEmail) return TEXT.emailRequired;
    if (!EMAIL_PATTERN.test(trimmedEmail)) return TEXT.emailInvalid;
    if (!password) return TEXT.passwordRequired;
    if (mode === 'register' && password.length < 6) {
      return TEXT.passwordTooShort;
    }

    return '';
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validate();
    if (validationError) {
      setNotice({ kind: 'error', text: validationError });
      return;
    }

    setLoading(true);
    setNotice(null);

    try {
      const payload = mode === 'login'
        ? { email: email.trim(), password }
        : { username: username.trim(), email: email.trim(), password };

      const response = await fetch(
        mode === 'login' ? '/api/auth/login' : '/api/auth/register',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const result = await readApiResponse(response);
      if (!response.ok || (result.code !== undefined && result.code !== 200)) {
        throw new Error(result.message || TEXT.requestFailed);
      }

      if (mode === 'register') {
        setMode('login');
        setPassword('');
        setNotice({ kind: 'success', text: TEXT.registerSuccess });
        return;
      }

      router.push('/');
      router.refresh();
    } catch (error) {
      setNotice({
        kind: 'error',
        text: error instanceof Error ? error.message : TEXT.requestFailed,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#101010] text-white">
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-white text-[#111] shadow-[0_16px_40px_rgba(255,255,255,0.08)]">
              <Icon icon="lucide:message-circle" className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none text-white">VChat</p>
              <p className="mt-1 text-xs text-[#8c8c8c]">{TEXT.brandMeta}</p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-[#b8b8b8] sm:flex">
            <span className="h-2 w-2 rounded-full bg-[#8fb2ff]" />
            {TEXT.proxyProtected}
          </div>
        </header>

        <section className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(380px,0.72fr)] lg:gap-12">
          <div className="order-2 hidden min-h-[520px] flex-col justify-between rounded-[8px] border border-white/10 bg-[#181818] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.34)] lg:flex">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <p className="text-sm font-medium text-[#dcdcdc]">{TEXT.workspaceTitle}</p>
                  <p className="mt-1 text-xs text-[#858585]">{TEXT.workspaceSubtitle}</p>
                </div>
                <div className="rounded-full bg-[#24314f] px-3 py-1 text-xs font-medium text-[#bcd0ff]">
                  {TEXT.online}
                </div>
              </div>

              <div className="mt-7 space-y-4">
                <div className="rounded-[8px] bg-[#222] p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[#eeeeee]">
                    <Icon icon="lucide:sparkles" className="h-4 w-4 text-[#8fb2ff]" />
                    {TEXT.quickStart}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-[#cfcfcf]">
                    {QUICK_ACTIONS.map((action) => (
                      <span key={action} className="rounded-[6px] bg-white/[0.04] px-3 py-2">
                        {action}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-[8px] border border-white/10 bg-[#151515] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#777]">{TEXT.activeModel}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#f3f3f3]">{TEXT.assistantTitle}</p>
                      <p className="mt-1 text-xs text-[#858585]">{TEXT.assistantDesc}</p>
                    </div>
                    <Icon icon="lucide:bot" className="h-5 w-5 text-[#c8d7ff]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[8px] bg-white/[0.035] p-4">
              <p className="text-sm leading-6 text-[#d8d8d8]">{TEXT.panelNote}</p>
            </div>
          </div>

          <div className="order-1 mx-auto w-full max-w-md lg:order-2">
            <div className="rounded-[8px] border border-white/10 bg-[#1b1b1b] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.42)] sm:p-7">
              <div className="mb-7">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8fb2ff]">
                  {copy.eyebrow}
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-white">{copy.title}</h1>
                <p className="mt-3 text-sm leading-6 text-[#a7a7a7]">{copy.description}</p>
              </div>

              <div className="mb-6 grid grid-cols-2 rounded-[8px] bg-[#111] p-1">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className={`rounded-[6px] px-3 py-2 text-sm font-medium transition ${
                    mode === 'login'
                      ? 'bg-white text-[#111] shadow-sm'
                      : 'text-[#a7a7a7] hover:text-white'
                  }`}
                >
                  {TEXT.signInTab}
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className={`rounded-[6px] px-3 py-2 text-sm font-medium transition ${
                    mode === 'register'
                      ? 'bg-white text-[#111] shadow-sm'
                      : 'text-[#a7a7a7] hover:text-white'
                  }`}
                >
                  {TEXT.registerTab}
                </button>
              </div>

              <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
                {mode === 'register' ? (
                  <label className="block">
                    <span className="text-sm font-medium text-[#d8d8d8]">{TEXT.username}</span>
                    <input
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      disabled={loading}
                      autoComplete="username"
                      className="mt-2 h-11 w-full rounded-[6px] border border-white/10 bg-[#111] px-3 text-sm text-white outline-none transition placeholder:text-[#666] focus:border-[#8fb2ff] disabled:cursor-not-allowed disabled:opacity-60"
                      placeholder={TEXT.usernamePlaceholder}
                    />
                  </label>
                ) : null}

                <label className="block">
                  <span className="text-sm font-medium text-[#d8d8d8]">{TEXT.email}</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={loading}
                    autoComplete="email"
                    className="mt-2 h-11 w-full rounded-[6px] border border-white/10 bg-[#111] px-3 text-sm text-white outline-none transition placeholder:text-[#666] focus:border-[#8fb2ff] disabled:cursor-not-allowed disabled:opacity-60"
                    placeholder={TEXT.emailPlaceholder}
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-[#d8d8d8]">{TEXT.password}</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={loading}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    className="mt-2 h-11 w-full rounded-[6px] border border-white/10 bg-[#111] px-3 text-sm text-white outline-none transition placeholder:text-[#666] focus:border-[#8fb2ff] disabled:cursor-not-allowed disabled:opacity-60"
                    placeholder={passwordHint}
                  />
                </label>

                <div className="min-h-6">
                  {notice ? (
                    <p
                      className={`text-sm ${
                        notice.kind === 'success' ? 'text-[#a7f3c1]' : 'text-[#ffb4b4]'
                      }`}
                    >
                      {notice.text}
                    </p>
                  ) : null}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-[6px] bg-white px-4 text-sm font-semibold text-[#111] transition hover:bg-[#e8e8e8] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <Icon icon="lucide:loader-2" className="h-4 w-4 animate-spin" />
                  ) : null}
                  {loading ? copy.loading : copy.submit}
                </button>
              </form>
            </div>

            <p className="mt-4 text-center text-xs text-[#777]">{TEXT.footer}</p>
          </div>
        </section>
      </div>
    </main>
  );
}
