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
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [genderPreference, setGenderPreference] = useState<'male' | 'female' | 'any'>('any');
  const [inviteCode, setInviteCode] = useState('');
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
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="card-brutal bg-card w-full max-w-md p-6">
        <div className="mb-6 text-center">
          <h1 className="text-4xl font-black text-dark mb-1">JOIN STRANGER CHAT</h1>
          <p className="text-xs font-bold text-dim uppercase">Get an anonymous numeric public ID</p>
        </div>

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black mb-1 text-dark uppercase">MY GENDER</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'male' | 'female' | 'other')}
                className="input-brutal w-full font-bold text-sm bg-white"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black mb-1 text-dark uppercase">LOOKING FOR</label>
              <select
                value={genderPreference}
                onChange={(e) => setGenderPreference(e.target.value as 'male' | 'female' | 'any')}
                className="input-brutal w-full font-bold text-sm bg-white"
              >
                <option value="any">Any Gender</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black mb-1 text-dark uppercase">
              PASSWORD <span className="text-error">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-brutal w-full"
              placeholder="Minimum 6 characters"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-xs font-black mb-1 text-dark uppercase">
              USERNAME <span className="text-dim font-normal">(OPTIONAL)</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-brutal w-full"
              placeholder="Leave blank for auto-generated name"
            />
          </div>

          <div>
            <label className="block text-xs font-black mb-1 text-dark uppercase">
              INVITE CODE <span className="text-dim font-normal">(OPTIONAL)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                className={`input-brutal w-full uppercase ${
                  codeValid === true ? 'border-success' : codeValid === false ? 'border-error' : ''
                }`}
                placeholder="Optional 8-char code"
                maxLength={8}
              />
              {validatingCode && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full" />
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="p-3 border-[3px] border-black font-bold text-xs bg-error text-white">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-brutal gradient-yellow w-full py-3 font-black text-dark tracking-wide uppercase mt-2"
          >
            {loading ? 'CREATING ID...' : 'REGISTER & GET ID'}
          </button>
        </form>

        <div className="mt-5 text-center">
          <p className="text-sm font-bold text-dim">
            Already have an ID?{' '}
            <Link href="/login" className="text-dark underline hover:text-purple">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
