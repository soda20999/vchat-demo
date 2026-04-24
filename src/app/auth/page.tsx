'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Mode = 'login' | 'register';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(
        mode === 'login' ? '/api/auth/login' : '/api/auth/register',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            mode === 'login'
              ? { email, password }
              : { username, email, password }
          ),
        }
      );

      const text = await response.text();
      const result = text ? JSON.parse(text) : {};
      if (!response.ok) {
        throw new Error(result.message || text || 'Request failed');
      }

      if (mode === 'register') {
        setMode('login');
        setMessage('注册成功，请登录');
        return;
      }

      router.push('/');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#141414] p-6 text-white">
      <div className="w-full max-w-sm rounded-xl border border-white/10 bg-[#1f1f1f] p-6">
        <div className="mb-4 flex gap-2">
          <button
            className={`rounded px-3 py-2 text-sm ${mode === 'login' ? 'bg-white text-black' : 'bg-[#2a2a2a]'}`}
            onClick={() => setMode('login')}
          >
            登录
          </button>
          <button
            className={`rounded px-3 py-2 text-sm ${mode === 'register' ? 'bg-white text-black' : 'bg-[#2a2a2a]'}`}
            onClick={() => setMode('register')}
          >
            注册
          </button>
        </div>

        <div className="space-y-3">
          {mode === 'register' ? (
            <input
              className="w-full rounded border border-white/10 bg-[#111] px-3 py-2 outline-none"
              placeholder="用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          ) : null}

          <input
            className="w-full rounded border border-white/10 bg-[#111] px-3 py-2 outline-none"
            placeholder="邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            className="w-full rounded border border-white/10 bg-[#111] px-3 py-2 outline-none"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            className="w-full rounded bg-white px-3 py-2 text-black disabled:opacity-50"
            onClick={() => void submit()}
            disabled={loading}
          >
            {loading ? '提交中...' : mode === 'login' ? '登录' : '注册'}
          </button>

          {message ? (
            <div className="text-sm text-[#d0d0d0]">{message}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
