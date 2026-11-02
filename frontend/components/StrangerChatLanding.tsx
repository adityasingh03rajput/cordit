'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { useSocket } from '@/lib/useSocket';
import { userAPI } from '@/lib/api';

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

  // Server cancellation sync: wait for match:left_queue event (which sets isMatching = false in store)
  useEffect(() => {
    if (!isMatching && isCancelling) {
      setIsCancelling(false);
      setCancelledNotice('Search cancelled.');
      const t = setTimeout(() => setCancelledNotice(null), 3000);
      return () => clearTimeout(t);
    }
  }, [isMatching, isCancelling]);

  // Cancel timeout guard (5 seconds): in case network drops before ack arrives
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

  // 1. Random Matching Start
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

  // 2. Random Matching Cancel (Server-acknowledged)
  const handleCancelRandomMatch = () => {
    if (isCancelling) return;
    setIsCancelling(true);
    setCancelledNotice(null);
    leaveMatchingQueue();
  };

  // 3. Find by ID Flow
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
    <div className="flex-1 flex items-center justify-center bg-surface p-4 sm:p-6 overflow-y-auto">
      <div className="card-brutal bg-card p-6 sm:p-8 max-w-lg w-full text-left">
        {/* Header Block */}
        <div className="border-b-[3px] border-black pb-4 mb-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-dark">
              Meet someone new
            </h1>
            <span className="badge-brutal text-xs font-black bg-cyan text-white">
              STRANGER CHAT
            </span>
          </div>

          {/* Public Notice Banner */}
          <div
            className="mt-3 p-3 border-2 border-black bg-yellow-100 flex items-start gap-2.5"
            role="status"
          >
            <span className="text-base select-none" aria-hidden="true">
              👁️
            </span>
            <div className="text-xs font-bold text-dark leading-snug">
              <span className="uppercase tracking-wider block font-black text-xs text-black">
                Public Conversation Notice
              </span>
              Conversations are public. Other users may join as observers.
            </div>
          </div>
        </div>

        {/* Real-time Socket Disconnected Alert */}
        {!isConnected && (
          <div
            className="p-3 border-2 border-black bg-warning text-dark font-bold text-xs mb-4 flex items-center gap-2"
            role="alert"
          >
            <span className="text-base" aria-hidden="true">
              ⚠️
            </span>
            <span>Real-time connection offline. Reconnecting to server...</span>
          </div>
        )}

        {/* Server Match Error Alert */}
        {matchError && (
          <div
            className="p-3 border-2 border-black bg-error text-white font-bold text-xs mb-4 flex items-center justify-between gap-2"
            role="alert"
          >
            <span>{matchError}</span>
            <button
              type="button"
              onClick={() => setMatchError(null)}
              className="font-black text-xs px-1 hover:opacity-80"
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}

        {/* Search Cancelled Status Notice */}
        {cancelledNotice && (
          <div
            className="p-2.5 border-2 border-black bg-surface text-xs font-bold text-dark mb-4 text-center"
            role="status"
          >
            {cancelledNotice}
          </div>
        )}

        {/* Match Found State */}
        {matchedPartner && (
          <div
            className="p-4 border-[3px] border-black bg-green-100 text-center flex flex-col items-center justify-center gap-2 mb-5"
            role="status"
          >
            <span className="badge-brutal bg-success text-white text-xs font-black">
              MATCH FOUND!
            </span>
            <p className="font-black text-base text-dark">
              Connected with #{matchedPartner.publicId} ({matchedPartner.username})
            </p>
            <span className="text-xs font-bold text-dim">
              Gender: {matchedPartner.gender || 'other'} • Joining room...
            </span>
          </div>
        )}

        {/* Identity Section */}
        <div className="mb-5 p-3.5 border-2 border-black bg-muted flex items-center justify-between flex-wrap gap-2">
          <div>
            <span className="text-xs font-bold text-dim uppercase tracking-wider block">
              Your Public Identity
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              {user?.publicId ? (
                <span className="font-mono font-black text-lg text-dark">
                  #{user.publicId}
                </span>
              ) : (
                <span className="badge-brutal bg-gray-200 text-dark text-xs font-black">
                  ID UNAVAILABLE
                </span>
              )}
              {user?.username && (
                <span className="text-xs font-bold text-dim">
                  ({user.username})
                </span>
              )}
            </div>
          </div>

          {user?.publicId ? (
            <button
              type="button"
              onClick={copyPublicId}
              className="btn-brutal bg-card text-dark text-xs font-black px-3 py-1.5"
              aria-label="Copy your public ID"
            >
              {copiedId ? 'COPIED!' : 'COPY ID'}
            </button>
          ) : null}
        </div>

        {/* Gender & Preference Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label
              htmlFor="gender-select"
              className="block font-black text-xs uppercase tracking-wider mb-1.5 text-dark"
            >
              Your Gender
            </label>
            <select
              id="gender-select"
              value={gender}
              onChange={(e) =>
                handleGenderChange(e.target.value as 'male' | 'female' | 'other')
              }
              disabled={savingPrefs || isActionPending}
              className="input-brutal w-full p-2.5 font-bold text-sm bg-surface cursor-pointer disabled:opacity-60"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="preference-select"
              className="block font-black text-xs uppercase tracking-wider mb-1.5 text-dark"
            >
              Looking For
            </label>
            <select
              id="preference-select"
              value={matchingPreference}
              onChange={(e) =>
                handlePreferenceChange(e.target.value as 'male' | 'female' | 'any')
              }
              disabled={savingPrefs || isActionPending}
              className="input-brutal w-full p-2.5 font-bold text-sm bg-surface cursor-pointer disabled:opacity-60"
            >
              <option value="any">Any Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        {prefSaveSuccess && (
          <div className="mb-4 text-xs font-bold text-success" role="status">
            ✓ Preferences saved
          </div>
        )}
        {prefSaveError && (
          <div
            className="mb-4 card-brutal bg-error text-white p-2 text-xs font-bold"
            role="alert"
          >
            {prefSaveError}
          </div>
        )}

        {/* Active Random Matching "Finding" State */}
        {isMatching ? (
          <div
            className="p-5 border-[3px] border-black bg-yellow-50 text-center flex flex-col items-center justify-center gap-3 mb-5"
            role="status"
            aria-live="polite"
          >
            <div className="animate-spin h-9 w-9 border-4 border-black border-t-yellow rounded-full" />
            <div>
              <h3 className="font-black text-base text-dark uppercase tracking-tight">
                {isCancelling ? 'CANCELLING SEARCH...' : 'FINDING A MATCH...'}
              </h3>
              <p className="text-xs font-bold text-dim mt-0.5">
                {isCancelling
                  ? 'Confirming with server...'
                  : `Looking for a compatible partner (${matchingPreference === 'any' ? 'Any Gender' : matchingPreference})...`}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCancelRandomMatch}
              disabled={isCancelling}
              className="btn-brutal bg-error text-white font-black text-xs px-6 py-2 uppercase mt-1 tracking-wider disabled:opacity-60"
            >
              {isCancelling ? 'CANCELLING...' : 'CANCEL SEARCH'}
            </button>
          </div>
        ) : (
          /* Action: Random Match Button */
          <div className="mb-5">
            <button
              type="button"
              onClick={handleStartRandomMatch}
              disabled={!isConnected || isActionPending}
              className="btn-brutal w-full py-3.5 font-black text-sm uppercase tracking-wider text-dark flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'var(--bg-accent)' }}
            >
              <span>⚡</span>
              <span>Random Match</span>
            </button>
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-[2px] bg-black opacity-20" />
          <span className="text-xs font-black uppercase text-dim tracking-wider">
            OR FIND BY ID
          </span>
          <div className="flex-1 h-[2px] bg-black opacity-20" />
        </div>

        {/* Action: Find by ID */}
        <form onSubmit={handleDirectConnect} className="flex flex-col gap-2">
          <label
            htmlFor="stranger-id-input"
            className="block font-black text-xs uppercase tracking-wider text-dark"
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
              className="input-brutal flex-1 p-2.5 font-mono font-bold text-sm bg-surface disabled:opacity-60"
              aria-describedby={inputError ? 'stranger-id-error' : undefined}
            />
            <button
              type="submit"
              disabled={isActionPending || !isConnected || !targetIdInput.trim()}
              className="btn-brutal px-5 py-2.5 font-black text-xs uppercase tracking-wider text-white disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'var(--purple)' }}
            >
              {isDirectPending ? 'CONNECTING...' : 'CONNECT'}
            </button>
          </div>

          {inputError && (
            <div
              id="stranger-id-error"
              className="card-brutal bg-error text-white p-2.5 mt-2 font-bold text-xs"
              role="alert"
            >
              {inputError}
            </div>
          )}

          {isDirectPending && (
            <div className="p-2.5 border-2 border-black bg-surface text-xs font-bold text-dark mt-2 flex items-center gap-2">
              <div className="animate-spin h-3.5 w-3.5 border-2 border-black border-t-purple rounded-full" />
              <span>Contacting user #{targetIdInput}... Waiting for response.</span>
            </div>
          )}
        </form>

        {/* Secondary Navigation Helper */}
        {onOpenSidebar && (
          <div className="mt-6 pt-4 border-t-[2px] border-black border-dashed text-center">
            <button
              type="button"
              onClick={onOpenSidebar}
              className="text-xs font-bold text-dim underline hover:text-black uppercase tracking-wider"
            >
              Browse existing chat channels →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
