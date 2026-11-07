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
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const cleanUsername = username.trim();
      const cleanPassword = password.trim();
      const data = await authAPI.login(cleanUsername, cleanPassword);

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
    <div
      className="min-h-screen w-full relative flex items-center justify-center p-4 bg-cover bg-center overflow-hidden"
      style={{
        backgroundImage: "url('/wallpapers/cherry-blossom.png')",
        backgroundColor: '#0a0514',
      }}
    >
      {/* Subtle ambient overlay */}
      <div className="absolute inset-0 bg-black/25 backdrop-blur-[1px] pointer-events-none" />

      {/* Glassmorphic Login Card */}
      <div className="relative z-10 w-full max-w-[420px] rounded-3xl bg-[#140b24]/55 backdrop-blur-2xl border border-purple-500/30 p-7 sm:p-8 shadow-[0_0_60px_rgba(147,51,234,0.25),inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col items-center">
        {/* Soft decorative internal purple glow */}
        <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-36 bg-purple-600/25 blur-3xl rounded-full" />

        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 border border-purple-300/30 shadow-lg shadow-purple-900/50 flex items-center justify-center mb-3">
            <svg
              className="w-6 h-6 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Cordit</h1>
          <p className="text-xs font-normal text-purple-200/70 tracking-wide mt-1">
            Public stranger chat + voice
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-purple-200/90 mb-1.5">
              <svg
                className="w-3.5 h-3.5 text-purple-300/80"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>Public ID or Username</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full h-11 px-4 rounded-xl bg-[#1b1031]/80 hover:bg-[#23153e]/80 focus:bg-[#23153e] border border-purple-500/25 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 text-white placeholder-purple-300/30 text-sm outline-none transition-all duration-200"
              placeholder="e.g. 2134 or admin"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-purple-200/90 mb-1.5">
              <svg
                className="w-3.5 h-3.5 text-purple-300/80"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Password</span>
            </label>
            <div className="relative w-full">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 pl-4 pr-11 rounded-xl bg-[#1b1031]/80 hover:bg-[#23153e]/80 focus:bg-[#23153e] border border-purple-500/25 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 text-white placeholder-purple-300/30 text-sm outline-none transition-all duration-200"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-300/60 hover:text-purple-200 transition-colors p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs shadow-md backdrop-blur-sm">
              <div className="w-4 h-4 rounded-full bg-red-500/25 border border-red-400/60 text-red-200 flex items-center justify-center font-bold text-[10px] shrink-0">
                !
              </div>
              <span className="font-medium">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 mt-1 rounded-xl bg-gradient-to-r from-[#7c3aed] via-[#8b5cf6] to-[#a855f7] hover:from-[#6d28d9] hover:via-[#7c3aed] hover:to-[#9333ea] text-white font-semibold text-sm shadow-[0_4px_20px_rgba(139,92,246,0.4)] hover:shadow-[0_4px_28px_rgba(139,92,246,0.6)] transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
          >
            <span>{loading ? 'Logging in...' : 'Login'}</span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-purple-200/70">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="text-white hover:text-purple-300 font-medium underline transition-colors"
          >
            Create account & get Public ID
          </Link>
        </div>
      </div>
    </div>
  );
}
