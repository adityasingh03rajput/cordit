'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import { useStore } from '@/lib/store';

type ApiErrorShape = {
  response?: {
    data?: {
      error?: string;
    };
  };
};

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null) {
    const maybeApiError = error as ApiErrorShape;
    const message = maybeApiError.response?.data?.error;
    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
  }

  return fallback;
};

export default function LoginPage() {
  const router = useRouter();
  const setUser = useStore((state) => state.setUser);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authAPI.login(username, password);

      const user = {
        username: data.username,
        publicId: data.publicId,
        gender: data.gender,
        genderPreference: data.genderPreference,
        status: data.status,
        role: data.role,
        token: data.token,
      };

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);

      router.push('/');
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="card-brutal bg-card w-full max-w-md p-6">
        <div className="mb-6 text-center">
          <h1 className="text-4xl font-black text-dark mb-2">CORDIT</h1>
          <p className="text-sm font-medium text-dim">Public stranger chat + voice</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-bold mb-2 text-dark">PUBLIC ID OR USERNAME</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-brutal w-full"
              placeholder="e.g. 2134 or admin"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-dark">PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-brutal w-full"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="p-3 border-[3px] border-black font-bold text-sm bg-error text-white">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-brutal gradient-yellow w-full py-3 font-black text-dark tracking-wide"
          >
            {loading ? 'LOGGING IN...' : 'LOGIN'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm font-bold text-dim">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-dark underline hover:text-purple">
              Create account & get Public ID
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
