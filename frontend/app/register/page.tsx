'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI, inviteAPI } from '@/lib/api';
import { useStore } from '@/lib/store';

type ApiErrorShape = {
  response?: {
    data?: {
      error?: string;
      message?: string;
    };
  };
};

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null) {
    const maybeApiError = error as ApiErrorShape;
    const message = maybeApiError.response?.data?.error ?? maybeApiError.response?.data?.message;
    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
  }

  return fallback;
};

export default function RegisterPage() {
  const router = useRouter();
  const setUser = useStore((state) => state.setUser);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [genderPreference, setGenderPreference] = useState<'male' | 'female' | 'any'>('any');
  const [inviteCode, setInviteCode] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validatingCode, setValidatingCode] = useState(false);
  const [codeValid, setCodeValid] = useState<boolean | null>(null);

  const validateCode = async (code: string) => {
    if (code.length !== 8) {
      setCodeValid(null);
      return;
    }

    setValidatingCode(true);
    try {
      const result = await inviteAPI.validate(code);
      setCodeValid(result.valid);
      if (!result.valid) {
        setError(result.reason || 'Invalid invite code');
      } else {
        setError('');
      }
    } catch {
      setCodeValid(false);
      setError('Failed to validate code');
    } finally {
      setValidatingCode(false);
    }
  };

  const handleCodeChange = (value: string) => {
    const upperValue = value.toUpperCase();
    setInviteCode(upperValue);
    if (upperValue.length === 8) {
      validateCode(upperValue);
    } else {
      setCodeValid(null);
      setError('');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!ageConfirmed) {
      setError('You must confirm you are at least 18 years of age to register.');
      return;
    }

    setLoading(true);

    try {
      const data = await authAPI.register({
        username: username.trim() || undefined,
        password,
        gender,
        genderPreference,
        inviteCode: inviteCode.trim() || undefined,
      });

      const user = {
        username: data.username,
        publicId: data.publicId,
        gender: data.gender,
        genderPreference: data.genderPreference,
        status: data.status,
        role: (data.role || 'user') as 'user' | 'admin',
        token: data.token,
      };

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);

      router.push('/');
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full relative flex items-center justify-center p-4 bg-cover bg-center overflow-y-auto"
      style={{
        backgroundImage: "url('/wallpapers/cherry-blossom.png')",
        backgroundColor: '#0a0514',
      }}
    >
      {/* Subtle ambient overlay */}
      <div className="absolute inset-0 bg-black/25 backdrop-blur-[1px] pointer-events-none" />

      {/* Glassmorphic Register Card */}
      <div className="relative z-10 w-full max-w-[460px] my-6 rounded-3xl bg-[#140b24]/60 backdrop-blur-2xl border border-purple-500/30 p-7 sm:p-8 shadow-[0_0_60px_rgba(147,51,234,0.25),inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col items-center">
        {/* Soft decorative internal purple glow */}
        <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-36 bg-purple-600/25 blur-3xl rounded-full" />

        {/* Brand Header */}
        <div className="flex flex-col items-center mb-5 text-center">
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
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create Account</h1>
          <p className="text-xs font-normal text-purple-200/70 tracking-wide mt-1">
            Get an anonymous numeric public ID & start chatting
          </p>
        </div>

        {/* Register Form */}
        <form onSubmit={handleRegister} className="w-full flex flex-col gap-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-purple-200/90 mb-1.5">
                My Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'male' | 'female' | 'other')}
                className="w-full h-11 px-3 rounded-xl bg-[#1b1031]/80 hover:bg-[#23153e]/80 focus:bg-[#23153e] border border-purple-500/25 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 text-white text-sm outline-none transition-all cursor-pointer"
              >
                <option value="male" className="bg-[#1b1031] text-white">Male</option>
                <option value="female" className="bg-[#1b1031] text-white">Female</option>
                <option value="other" className="bg-[#1b1031] text-white">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-purple-200/90 mb-1.5">
                Looking For
              </label>
              <select
                value={genderPreference}
                onChange={(e) => setGenderPreference(e.target.value as 'male' | 'female' | 'any')}
                className="w-full h-11 px-3 rounded-xl bg-[#1b1031]/80 hover:bg-[#23153e]/80 focus:bg-[#23153e] border border-purple-500/25 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 text-white text-sm outline-none transition-all cursor-pointer"
              >
                <option value="any" className="bg-[#1b1031] text-white">Any Gender</option>
                <option value="female" className="bg-[#1b1031] text-white">Female</option>
                <option value="male" className="bg-[#1b1031] text-white">Male</option>
              </select>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-purple-200/90 mb-1.5">
              <svg className="w-3.5 h-3.5 text-purple-300/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Password <span className="text-purple-400">*</span></span>
            </label>
            <div className="relative w-full">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 pl-4 pr-11 rounded-xl bg-[#1b1031]/80 hover:bg-[#23153e]/80 focus:bg-[#23153e] border border-purple-500/25 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 text-white placeholder-purple-300/30 text-sm outline-none transition-all duration-200"
                placeholder="Minimum 6 characters"
                required
                minLength={6}
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

          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-purple-200/90 mb-1.5">
              <svg className="w-3.5 h-3.5 text-purple-300/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>Username <span className="text-purple-300/50 font-normal">(optional)</span></span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full h-11 px-4 rounded-xl bg-[#1b1031]/80 hover:bg-[#23153e]/80 focus:bg-[#23153e] border border-purple-500/25 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 text-white placeholder-purple-300/30 text-sm outline-none transition-all duration-200"
              placeholder="Leave blank for auto-generated name"
            />
          </div>

          <div>
            <label className="flex items-center justify-between text-xs font-medium text-purple-200/90 mb-1.5">
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-purple-300/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 5l4 4-11 11-4-4L15 5z" />
                  <path d="M18 8l2-2" />
                </svg>
                <span>Invite Code <span className="text-purple-300/50 font-normal">(optional)</span></span>
              </span>
              {codeValid === true && <span className="text-emerald-400 text-[11px] font-semibold">Valid</span>}
              {codeValid === false && <span className="text-rose-400 text-[11px] font-semibold">Invalid</span>}
            </label>
            <div className="relative w-full">
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                className={`w-full h-11 px-4 rounded-xl bg-[#1b1031]/80 hover:bg-[#23153e]/80 focus:bg-[#23153e] border ${codeValid === true
                    ? 'border-emerald-500/60 focus:border-emerald-400'
                    : codeValid === false
                      ? 'border-rose-500/60 focus:border-rose-400'
                      : 'border-purple-500/25 focus:border-purple-400'
                  } focus:ring-2 focus:ring-purple-500/30 text-white placeholder-purple-300/30 text-sm tracking-wider uppercase outline-none transition-all duration-200`}
                placeholder="Optional 8-char code"
                maxLength={8}
              />
              {validatingCode && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                  <div className="animate-spin h-4 w-4 border-2 border-purple-400 border-t-transparent rounded-full" />
                </div>
              )}
            </div>
          </div>

          {/* Legal Age Gate & Safety Checkbox */}
          <div className="flex items-start gap-2.5 my-1 px-1 bg-black/25 border border-purple-500/20 rounded-xl p-2.5">
            <input
              type="checkbox"
              id="ageConfirm"
              checked={ageConfirmed}
              onChange={(e) => setAgeConfirmed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-purple-500/40 bg-[#1b1031] text-purple-600 focus:ring-purple-500/30 cursor-pointer accent-purple-600 shrink-0"
              required
            />
            <label htmlFor="ageConfirm" className="text-[11px] leading-tight text-purple-200/80 cursor-pointer select-none">
              I confirm I am <strong className="text-white">18 years of age or older</strong> and agree to the <span className="underline text-purple-300">Public Live Conversation &amp; Broadcast Terms of Service</span>.
            </label>
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
            disabled={loading || !ageConfirmed}
            className="w-full h-11 mt-1 rounded-xl bg-gradient-to-r from-[#7c3aed] via-[#8b5cf6] to-[#a855f7] hover:from-[#6d28d9] hover:via-[#7c3aed] hover:to-[#9333ea] text-white font-semibold text-sm shadow-[0_4px_20px_rgba(139,92,246,0.4)] hover:shadow-[0_4px_28px_rgba(139,92,246,0.6)] transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>{loading ? 'Creating ID...' : 'Register & Get ID'}</span>
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
        <div className="mt-5 text-center text-xs text-purple-200/70">
          Already have an ID?{' '}
          <Link
            href="/login"
            className="text-white hover:text-purple-300 font-medium underline transition-colors"
          >
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
}
