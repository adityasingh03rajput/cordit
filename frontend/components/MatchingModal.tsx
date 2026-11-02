'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { useSocket } from '@/lib/useSocket';

interface MatchingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MatchingModal({ isOpen, onClose }: MatchingModalProps) {
  const { user, isMatching, matchingPreference, matchError, setMatchingPreference } = useStore();
  const { joinMatchingQueue, leaveMatchingQueue, requestDirectMatch } = useSocket();
  const [directId, setDirectId] = useState('');
  const [activeTab, setActiveTab] = useState<'random' | 'direct'>('random');

  if (!isOpen) return null;

  const handleStartRandom = (e: React.FormEvent) => {
    e.preventDefault();
    joinMatchingQueue(matchingPreference);
  };

  const handleCancelRandom = () => {
    leaveMatchingQueue();
  };

  const handleStartDirect = (e: React.FormEvent) => {
    e.preventDefault();
    const idNum = parseInt(directId.trim(), 10);
    if (!isNaN(idNum) && idNum > 0) {
      requestDirectMatch(idNum);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="card-brutal bg-card w-full max-w-md p-6 relative border-4 border-black">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-black">
          <div>
            <h2 className="text-2xl font-black text-dark uppercase tracking-tight">FIND A STRANGER</h2>
            <p className="text-xs font-bold text-dim">Public stranger conversations</p>
          </div>
          <button
            onClick={() => {
              if (isMatching) leaveMatchingQueue();
              onClose();
            }}
            className="btn-brutal bg-error text-white font-black text-xs px-2.5 py-1"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          <button
            type="button"
            onClick={() => setActiveTab('random')}
            className={`btn-brutal flex-1 py-2 text-xs font-black uppercase ${
              activeTab === 'random' ? 'gradient-yellow text-dark' : 'bg-surface text-dim'
            }`}
          >
            Random Match
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('direct')}
            className={`btn-brutal flex-1 py-2 text-xs font-black uppercase ${
              activeTab === 'direct' ? 'gradient-yellow text-dark' : 'bg-surface text-dim'
            }`}
          >
            Direct by ID
          </button>
        </div>

        {/* Tab 1: Random Matching */}
        {activeTab === 'random' && (
          <div>
            {!isMatching ? (
              <form onSubmit={handleStartRandom} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-black mb-1 uppercase text-dark">
                    MY IDENTITY
                  </label>
                  <div className="p-3 bg-surface border-2 border-black font-bold text-sm flex items-center justify-between">
                    <span>#{user?.publicId || '----'} • {user?.username}</span>
                    <span className="badge-brutal text-xs uppercase bg-white">
                      {user?.gender || 'other'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black mb-1 uppercase text-dark">
                    MATCHING PREFERENCE
                  </label>
                  <select
                    value={matchingPreference}
                    onChange={(e) => setMatchingPreference(e.target.value as 'male' | 'female' | 'any')}
                    className="input-brutal w-full font-bold text-sm bg-white"
                  >
                    <option value="any">Any Gender (Fastest)</option>
                    <option value="female">Female Partners Only</option>
                    <option value="male">Male Partners Only</option>
                  </select>
                  <p className="text-[11px] font-medium text-dim mt-1">
                    Matching is mutual: both users must satisfy each other&apos;s preference.
                  </p>
                </div>

                {matchError && (
                  <div className="p-3 border-2 border-black font-bold text-xs bg-error text-white">
                    {matchError}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn-brutal gradient-yellow w-full py-3 font-black text-sm text-dark tracking-wide uppercase mt-1"
                >
                  START MATCHING
                </button>
              </form>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="animate-spin h-10 w-10 border-4 border-black border-t-yellow rounded-full mb-4" />
                <h3 className="font-black text-lg text-dark uppercase mb-1">SEARCHING FOR STRANGER...</h3>
                <p className="text-xs font-bold text-dim mb-4">
                  Looking for a compatible {matchingPreference === 'any' ? 'partner' : matchingPreference}...
                </p>
                <button
                  onClick={handleCancelRandom}
                  className="btn-brutal bg-error text-white px-6 py-2 font-black text-xs uppercase"
                >
                  CANCEL SEARCH
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Direct Match by Public ID */}
        {activeTab === 'direct' && (
          <form onSubmit={handleStartDirect} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-black mb-1 uppercase text-dark">
                TARGET PUBLIC ID
              </label>
              <input
                type="number"
                value={directId}
                onChange={(e) => setDirectId(e.target.value)}
                placeholder="e.g. 2134"
                required
                className="input-brutal w-full font-bold text-base"
                autoFocus
              />
              <p className="text-[11px] font-medium text-dim mt-1">
                Enter the other user&apos;s numeric ID to initiate an instant public chat.
              </p>
            </div>

            {matchError && (
              <div className="p-3 border-2 border-black font-bold text-xs bg-error text-white">
                {matchError}
              </div>
            )}

            <button
              type="submit"
              disabled={!directId.trim()}
              className="btn-brutal gradient-yellow w-full py-3 font-black text-sm text-dark tracking-wide uppercase mt-1"
            >
              CONNECT DIRECTLY
            </button>
          </form>
        )}

        {/* Public Notice Footer */}
        <div className="mt-5 pt-3 border-t-2 border-black text-center">
          <span className="badge-brutal text-[10px] bg-surface font-black uppercase text-dim px-2 py-0.5">
            Public Conversation Notice
          </span>
          <p className="text-[10px] font-bold text-dim mt-1">
            All stranger chat rooms are public. Observers can view and offer suggestions.
          </p>
        </div>
      </div>
    </div>
  );
}

