'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { useSocket } from '@/lib/useSocket';
import { userAPI } from '@/lib/api';
import { useTheme } from '@/lib/ThemeContext';

interface StrangerChatLandingProps {
  onOpenSidebar?: () => void;
}

export default function StrangerChatLanding({ onOpenSidebar }: StrangerChatLandingProps) {
  const {
    user,
    setUser,
    isMatching,
    matchingPreference,
    matchError,
    matchedPartner,
    isConnected,
    setMatchingPreference,
    setMatchError,
    setMatching,
  } = useStore();

  const { joinMatchingQueue, leaveMatchingQueue, requestDirectMatch } = useSocket();
  const { theme } = useTheme();

  const [gender, setGender] = useState<'male' | 'female' | 'other'>(
    user?.gender || 'other'
  );
  const [targetIdInput, setTargetIdInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [isDirectPending, setIsDirectPending] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefSaveSuccess, setPrefSaveSuccess] = useState(false);
  const [prefSaveError, setPrefSaveError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [cancelledNotice, setCancelledNotice] = useState<string | null>(null);

  // Synchronize local states when user store updates
  useEffect(() => {
    if (user?.gender) setGender(user.gender);
    if (user?.genderPreference) setMatchingPreference(user.genderPreference);
  }, [user?.gender, user?.genderPreference, setMatchingPreference]);

  // Direct pending state clearance guards: match:found, match:error, disconnect
  useEffect(() => {
    if (matchError || matchedPartner || !isConnected) {
      setIsDirectPending(false);
    }
  }, [matchError, matchedPartner, isConnected]);

  // Direct match timeout guard (10 seconds) to avoid UI getting stuck
  useEffect(() => {
    let directTimer: NodeJS.Timeout;
    if (isDirectPending) {
      directTimer = setTimeout(() => {
        setIsDirectPending(false);
        setMatchError('Connection request timed out. Target user may be busy or unresponsive.');
      }, 10000);
    }
    return () => clearTimeout(directTimer);
  }, [isDirectPending, setMatchError]);

  // Server cancellation sync: wait for match:left_queue event
  useEffect(() => {
    if (!isMatching && isCancelling) {
      setIsCancelling(false);
      setCancelledNotice('Search cancelled.');
      const t = setTimeout(() => setCancelledNotice(null), 3000);
      return () => clearTimeout(t);
    }
  }, [isMatching, isCancelling]);

  // Cancel timeout guard (5 seconds)
  useEffect(() => {
    let cancelTimer: NodeJS.Timeout;
    if (isCancelling) {
      cancelTimer = setTimeout(() => {
        setIsCancelling(false);
        setMatching(false);
        setCancelledNotice('Search cancelled locally (timeout).');
        const t = setTimeout(() => setCancelledNotice(null), 3000);
        return () => clearTimeout(t);
      }, 5000);
    }
    return () => clearTimeout(cancelTimer);
  }, [isCancelling, setMatching]);

  const handleGenderChange = async (newGender: 'male' | 'female' | 'other') => {
    const previousGender = gender;
    setGender(newGender);
    await persistPreferences(newGender, matchingPreference, () => setGender(previousGender));
  };

  const handlePreferenceChange = async (newPref: 'male' | 'female' | 'any') => {
    const previousPref = matchingPreference;
    setMatchingPreference(newPref);
    await persistPreferences(gender, newPref, () => setMatchingPreference(previousPref));
  };

  const persistPreferences = async (
    g: 'male' | 'female' | 'other',
    pref: 'male' | 'female' | 'any',
    onRevert: () => void
  ) => {
    setSavingPrefs(true);
    setPrefSaveError(null);
    setPrefSaveSuccess(false);

    try {
      await userAPI.updateProfile(g, pref);
      if (user) {
        setUser({
          ...user,
          gender: g,
          genderPreference: pref,
        });
      }
      setPrefSaveSuccess(true);
      setTimeout(() => setPrefSaveSuccess(false), 2000);
    } catch (err: unknown) {
      console.error('Failed to update profile preferences:', err);
      onRevert();
      const message =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { error?: string; message?: string } } }).response?.data?.error ||
            (err as { response?: { data?: { error?: string; message?: string } } }).response?.data?.message
          : null;
      setPrefSaveError(message || 'Failed to save preference. Please try again.');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleStartRandomMatch = () => {
    if (!isConnected) {
      setMatchError('Real-time connection is offline. Reconnecting to server...');
      return;
    }
    setCancelledNotice(null);
    setMatchError(null);
    setInputError(null);
    setIsDirectPending(false);
    setIsCancelling(false);
    joinMatchingQueue(matchingPreference);
  };

  const handleCancelRandomMatch = () => {
    if (isCancelling) return;
    setIsCancelling(true);
    setCancelledNotice(null);
    leaveMatchingQueue();
  };

  const handleDirectConnect = (e: React.FormEvent) => {
    e.preventDefault();
    setInputError(null);
    setCancelledNotice(null);
    setMatchError(null);

    if (isMatching || isDirectPending || isCancelling) return;

    if (!isConnected) {
      setMatchError('Real-time connection is offline. Reconnecting to server...');
      return;
    }

    const trimmed = targetIdInput.trim();
    if (!trimmed) {
      setInputError('Please enter a numeric public ID.');
      return;
    }

    if (!/^\d{4,6}$/.test(trimmed)) {
      setInputError('Public ID must be a 4 to 6-digit number.');
      return;
    }

    const numId = parseInt(trimmed, 10);
    if (user?.publicId && numId === user.publicId) {
      setInputError('You cannot connect with your own ID.');
      return;
    }

    setIsDirectPending(true);
    requestDirectMatch(numId);
  };

  const copyPublicId = () => {
    if (!user?.publicId) return;
    navigator.clipboard.writeText(String(user.publicId));
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const isActionPending = isMatching || isDirectPending || isCancelling;

  return (
    <div className="flex-1 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Frosted Glass Acrylic Cupertino Card */}
      <div
        className="relative rounded-[28px] sm:rounded-[36px] p-6 sm:p-8 max-w-lg w-full text-left shadow-[0_24px_64px_rgba(0,0,0,0.5)] border backdrop-blur-2xl transition-all duration-300"
        style={{
          backgroundColor: `${theme.surfaceSolid}F2`,
          borderColor: theme.border,
          color: theme.text,
        }}
      >
        {/* Header Block */}
        <div className="pb-4 mb-5 border-b border-white/10">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Meet Someone New
            </h1>
            <span
              className="text-[11px] font-black tracking-wider uppercase px-3 py-1 rounded-full shadow-sm"
              style={{
                backgroundColor: theme.primary,
                color: theme.outgoingText,
              }}
            >
              Stranger Chat
            </span>
          </div>

          {/* Public Notice Banner */}
          <div
            className="mt-3.5 p-3 rounded-2xl border border-white/10 bg-white/5 flex items-start gap-2.5 backdrop-blur-sm"
            role="status"
          >
            <span className="text-base select-none" aria-hidden="true">
              👁️
            </span>
            <div className="text-xs leading-snug">
              <span className="uppercase tracking-wider block font-bold text-[11px] opacity-90">
                Public Conversation Notice
              </span>
              <span className="opacity-70">
                Conversations are public. Other users may join as silent observers.
              </span>
            </div>
          </div>
        </div>

        {/* Real-time Socket Disconnected Alert */}
        {!isConnected && (
          <div
            className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/15 text-amber-200 font-semibold text-xs mb-4 flex items-center gap-2.5 backdrop-blur-md animate-pulse"
            role="alert"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
            <span>Real-time connection offline. Reconnecting to server...</span>
          </div>
        )}

        {/* Server Match Error Alert */}
        {matchError && (
          <div
            className="p-3.5 rounded-2xl border border-red-500/40 bg-red-600/20 text-red-200 font-semibold text-xs mb-4 flex items-center justify-between gap-2 backdrop-blur-md"
            role="alert"
          >
            <span>{matchError}</span>
            <button
              type="button"
              onClick={() => setMatchError(null)}
              className="text-white/60 hover:text-white font-bold text-xs px-1.5 py-0.5 rounded-md hover:bg-white/10"
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}

        {/* Search Cancelled Status Notice */}
        {cancelledNotice && (
          <div
            className="p-2.5 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold mb-4 text-center opacity-80"
            role="status"
          >
            {cancelledNotice}
          </div>
        )}

        {/* Match Found State */}
        {matchedPartner && (
          <div
            className="p-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/20 text-center flex flex-col items-center justify-center gap-2 mb-5 backdrop-blur-md animate-scale-in"
            role="status"
          >
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500 text-white shadow-sm">
              Match Found!
            </span>
            <p className="font-extrabold text-base text-emerald-100">
              Connected with #{matchedPartner.publicId} ({matchedPartner.username})
            </p>
            <span className="text-xs font-medium text-emerald-200/70">
              Gender: {matchedPartner.gender || 'other'} • Joining room...
            </span>
          </div>
        )}

        {/* Identity Section */}
        <div
          className="mb-5 p-4 rounded-2xl border border-white/10 flex items-center justify-between flex-wrap gap-3"
          style={{ backgroundColor: `${theme.surface}99` }}
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider block opacity-60">
              Your Public Identity
            </span>
            <div className="flex items-center gap-2 mt-1">
              {user?.publicId ? (
                <span className="font-mono font-black text-xl tracking-tight">
                  #{user.publicId}
                </span>
              ) : (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/10 opacity-70">
                  ID Unavailable
                </span>
              )}
              {user?.username && (
                <span className="text-xs font-semibold opacity-70">
                  ({user.username})
                </span>
              )}
            </div>
          </div>

          {user?.publicId ? (
            <button
              type="button"
              onClick={copyPublicId}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 shadow-xs"
              style={{
                backgroundColor: copiedId ? theme.primary : `${theme.surfaceSolid}CC`,
                borderColor: theme.border,
                color: copiedId ? theme.outgoingText : theme.text,
              }}
              aria-label="Copy your public ID"
            >
              {copiedId ? '✓ Copied' : 'Copy ID'}
            </button>
          ) : null}
        </div>

        {/* Gender & Preference Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-4">
          <div>
            <label
              htmlFor="gender-select"
              className="block font-bold text-xs uppercase tracking-wider mb-1.5 opacity-70"
            >
              Your Gender
            </label>
            <div className="relative">
              <select
                id="gender-select"
                value={gender}
                onChange={(e) =>
                  handleGenderChange(e.target.value as 'male' | 'female' | 'other')
                }
                disabled={savingPrefs || isActionPending}
                className="w-full p-3 rounded-2xl font-semibold text-sm border outline-none cursor-pointer transition-all disabled:opacity-50 appearance-none pr-9"
                style={{
                  backgroundColor: `${theme.surfaceSolid}DD`,
                  borderColor: theme.border,
                  color: theme.text,
                }}
              >
                <option value="male" className="bg-[#1c1c20] text-white">Male</option>
                <option value="female" className="bg-[#1c1c20] text-white">Female</option>
                <option value="other" className="bg-[#1c1c20] text-white">Other</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 opacity-60">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="preference-select"
              className="block font-bold text-xs uppercase tracking-wider mb-1.5 opacity-70"
            >
              Looking For
            </label>
            <div className="relative">
              <select
                id="preference-select"
                value={matchingPreference}
                onChange={(e) =>
                  handlePreferenceChange(e.target.value as 'male' | 'female' | 'any')
                }
                disabled={savingPrefs || isActionPending}
                className="w-full p-3 rounded-2xl font-semibold text-sm border outline-none cursor-pointer transition-all disabled:opacity-50 appearance-none pr-9"
                style={{
                  backgroundColor: `${theme.surfaceSolid}DD`,
                  borderColor: theme.border,
                  color: theme.text,
                }}
              >
                <option value="any" className="bg-[#1c1c20] text-white">Any Gender</option>
                <option value="male" className="bg-[#1c1c20] text-white">Male</option>
                <option value="female" className="bg-[#1c1c20] text-white">Female</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 opacity-60">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
          </div>
        </div>

        {prefSaveSuccess && (
          <div className="mb-4 text-xs font-bold text-emerald-400" role="status">
            ✓ Preferences saved
          </div>
        )}
        {prefSaveError && (
          <div
            className="mb-4 p-2.5 rounded-xl border border-red-500/30 bg-red-600/20 text-red-200 text-xs font-semibold"
            role="alert"
          >
            {prefSaveError}
          </div>
        )}

        {/* Active Random Matching "Finding" State */}
        {isMatching ? (
          <div
            className="p-5 rounded-2xl border border-white/15 text-center flex flex-col items-center justify-center gap-3.5 mb-5 backdrop-blur-xl animate-fade-in"
            style={{ backgroundColor: `${theme.surface}CC` }}
            role="status"
            aria-live="polite"
          >
            <div
              className="animate-spin h-9 w-9 rounded-full border-3 border-transparent"
              style={{
                borderTopColor: theme.primary,
                borderRightColor: theme.primary,
                borderBottomColor: 'rgba(255,255,255,0.1)',
                borderLeftColor: 'rgba(255,255,255,0.1)',
              }}
            />
            <div>
              <h3 className="font-extrabold text-base tracking-tight uppercase">
                {isCancelling ? 'Cancelling Search...' : 'Finding a Compatible Partner...'}
              </h3>
              <p className="text-xs font-medium opacity-70 mt-1">
                {isCancelling
                  ? 'Confirming with server...'
                  : `Searching pool for ${matchingPreference === 'any' ? 'Any Gender' : matchingPreference}...`}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCancelRandomMatch}
              disabled={isCancelling}
              className="h-10 px-6 rounded-xl font-bold text-xs uppercase tracking-wider bg-red-600/90 text-white shadow-md active:scale-95 transition-all hover:bg-red-600 disabled:opacity-50"
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Search'}
            </button>
          </div>
        ) : (
          /* Action: Random Match Button */
          <div className="mb-5">
            <button
              type="button"
              onClick={handleStartRandomMatch}
              disabled={!isConnected || isActionPending}
              className="w-full py-3.5 px-6 rounded-2xl font-extrabold text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                backgroundColor: theme.primary,
                color: theme.outgoingText,
              }}
            >
              <span>⚡</span>
              <span>Find Random Partner</span>
            </button>
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5 opacity-40">
          <div className="flex-1 h-px bg-white" />
          <span className="text-[11px] font-black uppercase tracking-wider">
            Or Find by ID
          </span>
          <div className="flex-1 h-px bg-white" />
        </div>

        {/* Action: Find by ID */}
        <form onSubmit={handleDirectConnect} className="flex flex-col gap-2">
          <label
            htmlFor="stranger-id-input"
            className="block font-bold text-xs uppercase tracking-wider opacity-70"
          >
            Enter 4–6 Digit Public ID
          </label>
          <div className="flex gap-2">
            <input
              id="stranger-id-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={targetIdInput}
              disabled={isActionPending || !isConnected}
              onChange={(e) => {
                setTargetIdInput(e.target.value.replace(/\D/g, ''));
                if (inputError) setInputError(null);
              }}
              placeholder="e.g. 4819"
              className="flex-1 p-3 rounded-2xl font-mono font-bold text-sm border outline-none transition-all disabled:opacity-50"
              style={{
                backgroundColor: `${theme.surfaceSolid}CC`,
                borderColor: theme.border,
                color: theme.text,
              }}
              aria-describedby={inputError ? 'stranger-id-error' : undefined}
            />
            <button
              type="submit"
              disabled={isActionPending || !isConnected || !targetIdInput.trim()}
              className="px-5 py-3 rounded-2xl font-bold text-xs tracking-wider transition-all active:scale-95 disabled:opacity-40 shadow-md"
              style={{
                backgroundColor: theme.primary,
                color: theme.outgoingText,
              }}
            >
              {isDirectPending ? 'Connecting...' : 'Connect'}
            </button>
          </div>

          {inputError && (
            <div
              id="stranger-id-error"
              className="p-2.5 rounded-xl border border-red-500/40 bg-red-600/20 text-red-200 font-semibold text-xs mt-2"
              role="alert"
            >
              {inputError}
            </div>
          )}

          {isDirectPending && (
            <div className="p-3 rounded-2xl border border-white/10 bg-white/5 text-xs font-semibold mt-2 flex items-center gap-2.5 backdrop-blur-sm">
              <div
                className="animate-spin h-3.5 w-3.5 rounded-full border-2 border-transparent"
                style={{
                  borderTopColor: theme.primary,
                  borderRightColor: theme.primary,
                }}
              />
              <span>Contacting user #{targetIdInput}... Waiting for response.</span>
            </div>
          )}
        </form>

        {/* Secondary Navigation Helper */}
        {onOpenSidebar && (
          <div className="mt-6 pt-4 border-t border-white/10 text-center">
            <button
              type="button"
              onClick={onOpenSidebar}
              className="text-xs font-bold opacity-60 hover:opacity-100 transition-opacity tracking-wider hover:underline"
            >
              Browse existing chat channels →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
