'use client';

import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import type { ApiResponseEnvelope } from '@/types';

type Mode = 'login' | 'register';
type NoticeKind = 'error' | 'success';

type Notice = {
  kind: NoticeKind;
  text: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TEXT = {
  username: '用户名',
  email: '邮箱',
  password: '密码',
  usernamePlaceholder: '请输入用户名',
  emailPlaceholder: '请输入邮箱',
  signInTab: '登录',
  registerTab: '注册',
  passwordLoginHint: '请输入密码',
  passwordRegisterHint: '至少 6 位字符',
  usernameRequired: '用户名至少需要 2 个字符',
  emailRequired: '请输入邮箱',
  emailInvalid: '请输入有效邮箱',
  passwordRequired: '请输入密码',
  passwordTooShort: '密码至少需要 6 位字符',
  requestFailed: '请求失败，请稍后再试',
  registerSuccess: '注册成功，请使用新账号登录',
  agreement: '登录注册即代表已阅读并同意我们的',
  userAgreement: '用户协议',
  privacyPolicy: '隐私政策',
  and: '与',
  registerHint: '没有账号可切换注册',
};

const MODE_COPY = {
  login: {
    submit: '登录',
    loading: '正在登录...',
  },
  register: {
    submit: '注册',
    loading: '正在注册...',
  },
} satisfies Record<
  Mode,
  {
    submit: string;
    loading: string;
  }
>;

async function readApiResponse(response: Response): Promise<ApiResponseEnvelope> {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text) as ApiResponseEnvelope;
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
    () => (mode === 'register' ? TEXT.passwordRegisterHint : TEXT.passwordLoginHint),
    [mode],
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
      const payload =
        mode === 'login'
          ? { email: email.trim(), password }
          : { username: username.trim(), email: email.trim(), password };

      const response = await fetch(mode === 'login' ? '/api/auth/login' : '/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

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
    <main className="min-h-screen overflow-hidden bg-[#101112] text-white">
      <div className="flex min-h-screen w-full flex-col items-center justify-center px-5 py-10">
        <section className="flex w-full max-w-[414px] flex-col items-center">
          <div className="mb-14 flex items-center gap-3 text-[#5b86ff]">
            <Icon icon="lucide:messages-square" className="h-9 w-9" />
            <span className="text-[34px] font-semibold leading-none">vchat</span>
          </div>

          <div className="w-full">
            <div className="mb-7 grid grid-cols-2 rounded-full border border-[#2c2d30] bg-[#18191b] p-1">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`rounded-full px-3 py-2.5 text-sm font-medium transition ${
                  mode === 'login'
                    ? 'bg-[#5b86ff] text-white shadow-[0_8px_24px_rgba(91,134,255,0.24)]'
                    : 'text-[#8d94a1] hover:text-white'
                }`}
              >
                {TEXT.signInTab}
              </button>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className={`rounded-full px-3 py-2.5 text-sm font-medium transition ${
                  mode === 'register'
                    ? 'bg-[#5b86ff] text-white shadow-[0_8px_24px_rgba(91,134,255,0.24)]'
                    : 'text-[#8d94a1] hover:text-white'
                }`}
              >
                {TEXT.registerTab}
              </button>
            </div>

            <form className="space-y-7" onSubmit={(event) => void handleSubmit(event)}>
              {mode === 'register' ? (
                <label className="block">
                  <span className="sr-only">{TEXT.username}</span>
                  <input
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    disabled={loading}
                    autoComplete="username"
                    className="h-[60px] w-full rounded-full border border-[#303136] bg-[#191a1c] px-6 text-[16px] text-white outline-none transition placeholder:text-[#737985] focus:border-[#5b86ff] disabled:cursor-not-allowed disabled:opacity-60"
                    placeholder={TEXT.usernamePlaceholder}
                  />
                </label>
              ) : null}

              <label className="block">
                <span className="sr-only">{TEXT.email}</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={loading}
                  autoComplete="email"
                  className="h-[60px] w-full rounded-full border border-[#303136] bg-[#191a1c] px-6 text-[16px] text-white outline-none transition placeholder:text-[#737985] focus:border-[#5b86ff] disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder={TEXT.emailPlaceholder}
                />
              </label>

              <label className="block">
                <span className="sr-only">{TEXT.password}</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={loading}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="h-[60px] w-full rounded-full border border-[#303136] bg-[#191a1c] px-6 text-[16px] text-white outline-none transition placeholder:text-[#737985] focus:border-[#5b86ff] disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder={passwordHint}
                />
              </label>

              <p className="min-h-[46px] text-center text-sm leading-[22px] text-[#8d94a1]">
                {TEXT.agreement}
                <button
                  type="button"
                  className="mx-1 font-medium text-[#d5d8df] underline underline-offset-4"
                >
                  {TEXT.userAgreement}
                </button>
                {TEXT.and}
                <button
                  type="button"
                  className="mx-1 font-medium text-[#d5d8df] underline underline-offset-4"
                >
                  {TEXT.privacyPolicy}
                </button>
                {mode === 'login' ? (
                  <>
                    <span>，</span>
                    {TEXT.registerHint}
                  </>
                ) : null}
              </p>

              <button
                type="submit"
                disabled={loading}
                className="flex h-[56px] w-full items-center justify-center gap-2 rounded-full bg-[#5b86ff] px-4 text-[16px] font-semibold text-white transition hover:bg-[#6b92ff] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? <Icon icon="lucide:loader-2" className="h-4 w-4 animate-spin" /> : null}
                {loading ? copy.loading : copy.submit}
              </button>
            </form>

            <div className="mt-5 min-h-6 text-center">
              {notice ? (
                <p
                  className={`text-sm ${
                    notice.kind === 'success' ? 'text-[#8ee7ad]' : 'text-[#ff9e9e]'
                  }`}
                >
                  {notice.text}
                </p>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
