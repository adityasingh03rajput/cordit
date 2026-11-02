'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { useSocket } from '@/lib/useSocket';
import { formatDistanceToNow } from 'date-fns';

interface RightSidebarProps {
  onJoinVoice?: () => void;
  onLeaveVoice?: () => void;
  isInVoice?: boolean;
  connectingVoice?: boolean;
}

export default function RightSidebar({
  onJoinVoice,
  onLeaveVoice,
  isInVoice = false,
  connectingVoice = false,
}: RightSidebarProps) {
  const { currentRoom, suggestions, userRoleInCurrentRoom, user } = useStore();
  const { toggleSuggestionVisibility, sendSuggestion } = useSocket();

  const [isVoiceCollapsed, setIsVoiceCollapsed] = useState(false);
  const [isSuggestionsCollapsed, setIsSuggestionsCollapsed] = useState(false);
  const [showDropInput, setShowDropInput] = useState(false);
  const [suggestionText, setSuggestionText] = useState('');
  const [submittingSugg, setSubmittingSugg] = useState(false);

  // Hidden state per user locally or from backend visibleTo
  const [hiddenSuggestions, setHiddenSuggestions] = useState<Record<string, boolean>>({
    'mock-2': true,
  });

  const handleToggleEye = (suggId: string) => {
    const isCurrentlyHidden = !!hiddenSuggestions[suggId];
    setHiddenSuggestions((prev) => ({ ...prev, [suggId]: !isCurrentlyHidden }));
    toggleSuggestionVisibility(suggId, isCurrentlyHidden); // if currently hidden, make visible (true)
  };

  const handleDismiss = (suggId: string) => {
    setHiddenSuggestions((prev) => ({ ...prev, [suggId]: true }));
    toggleSuggestionVisibility(suggId, false);
  };

  const handleSendSuggestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestionText.trim() || submittingSugg) return;
    setSubmittingSugg(true);
    try {
      sendSuggestion(suggestionText.trim());
      setSuggestionText('');
      setShowDropInput(false);
    } catch (err) {
      console.error('Failed to drop suggestion:', err);
    } finally {
      setSubmittingSugg(false);
    }
  };

  // Mock placeholder suggestions if none exist in room yet so the mockup look is instant
  const displaySuggestions = suggestions.length > 0 ? suggestions : [
    {
      _id: 'mock-1',
      roomId: currentRoom?._id || '',
      observerId: '1',
      observerPublicId: 8234,
      observerUsername: 'user_8234',
      content: 'You guys should discuss your favorite books!',
      createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    },
    {
      _id: 'mock-2',
      roomId: currentRoom?._id || '',
      observerId: '2',
      observerPublicId: 9001,
      observerUsername: 'user_9001',
      content: 'Ask each other about hobbies!',
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
    {
      _id: 'mock-3',
      roomId: currentRoom?._id || '',
      observerId: '3',
      observerPublicId: 7420,
      observerUsername: 'user_7420',
      content: 'Try a fun rapid Q&A!',
      createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    },
  ];

  // Audio wave heights pattern matching the mockup visual
  const waveBars = [
    { height: '16px', color: '#b91c1c' },
    { height: '26px', color: '#ffffff' },
    { height: '42px', color: '#b91c1c' },
    { height: '22px', color: '#ffffff' },
    { height: '34px', color: '#b91c1c' },
    { height: '50px', color: '#ffffff' },
    { height: '58px', color: '#b91c1c' },
    { height: '40px', color: '#ffffff' },
    { height: '46px', color: '#b91c1c' },
    { height: '26px', color: '#ffffff' },
    { height: '36px', color: '#b91c1c' },
    { height: '20px', color: '#ffffff' },
    { height: '28px', color: '#b91c1c' },
    { height: '14px', color: '#ffffff' },
  ];

  return (
    <aside className="w-80 flex-shrink-0 flex flex-col gap-4 p-4 pr-6 select-none overflow-y-auto bg-transparent z-10">
      {/* ── CARD 1: VOICE CHAT ── */}
      <div className="bg-[#18181b]/90 backdrop-blur-md text-white rounded-2xl p-4 shadow-lg border border-neutral-800/80">
        <header className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
            <h3 className="font-bold text-sm tracking-wide">Voice Chat</h3>
          </div>
          <button
            onClick={() => setIsVoiceCollapsed(!isVoiceCollapsed)}
            className="text-neutral-400 hover:text-white p-1 text-xs"
            aria-label="Toggle voice chat"
          >
            {isVoiceCollapsed ? '⌄' : '⌃'}
          </button>
        </header>

        {!isVoiceCollapsed && (
          <div className="pt-4 flex flex-col items-center">
            {/* Waveform Visualizer */}
            <div className="h-14 flex items-center justify-center gap-1.5 w-full px-2">
              {waveBars.map((bar, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-300 ${isInVoice ? 'animate-pulse' : ''
                    }`}
                  style={{
                    height: bar.height,
                    backgroundColor: bar.color,
                    opacity: isInVoice ? 1 : 0.85,
                  }}
                />
              ))}
            </div>

            <p className="text-xs text-neutral-400 font-medium mt-1 mb-4 text-center">
              {isInVoice ? 'Connected to voice' : 'No one in voice yet'}
            </p>

            <button
              onClick={isInVoice ? onLeaveVoice : onJoinVoice}
              disabled={connectingVoice}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${isInVoice
                  ? 'bg-neutral-800 hover:bg-neutral-700 text-white'
                  : 'bg-[#b91c1c] hover:bg-[#a11818] text-white'
                }`}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
              </svg>
              <span>{connectingVoice ? 'Connecting...' : isInVoice ? 'Leave Voice' : 'Join Voice'}</span>
            </button>
          </div>
        )}
      </div>

      {/* ── CARD 2: SUGGESTIONS ── */}
      <div className="bg-[#18181b]/90 backdrop-blur-md text-white rounded-2xl p-4 shadow-lg border border-neutral-800/80">
        <header className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 text-sm">💡</span>
            <h3 className="font-bold text-sm tracking-wide">
              Suggestions ({displaySuggestions.length})
            </h3>
          </div>
          <button
            onClick={() => setIsSuggestionsCollapsed(!isSuggestionsCollapsed)}
            className="text-neutral-400 hover:text-white p-1 text-xs"
            aria-label="Toggle suggestions"
          >
            {isSuggestionsCollapsed ? '⌄' : '⌃'}
          </button>
        </header>

        {!isSuggestionsCollapsed && (
          <div className="pt-3 flex flex-col gap-2.5">
            {displaySuggestions.map((sugg) => {
              const isHidden = !!hiddenSuggestions[sugg._id];
              let timeStr = '2m ago';
              try {
                const diffMs = Date.now() - new Date(sugg.createdAt).getTime();
                const diffMins = Math.max(1, Math.round(diffMs / 60000));
                timeStr = `${diffMins}m ago`;
              } catch {
                timeStr = '2m ago';
              }

              return (
                <div
                  key={sugg._id}
                  className={`bg-[#202025] rounded-xl p-3 flex items-start justify-between gap-2.5 border transition-all ${isHidden ? 'opacity-40 border-transparent' : 'border-neutral-800/60'
                    }`}
                >
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="text-amber-400 text-xs mt-0.5 flex-shrink-0">💡</span>
                    <div className="min-w-0">
                      <p className={`text-xs font-medium text-neutral-100 leading-snug break-words ${isHidden ? 'line-through text-neutral-400' : ''}`}>
                        {sugg.content}
                      </p>
                      <p className="text-[10px] text-neutral-400 mt-1 truncate">
                        by #{sugg.observerPublicId} • {timeStr}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-1">
                    {/* Visibility Toggle Eye */}
                    <button
                      onClick={() => handleToggleEye(sugg._id)}
                      className={`p-1.5 rounded-lg text-xs transition-colors ${!isHidden
                          ? 'bg-[#b91c1c] text-white hover:bg-red-700'
                          : 'bg-[#2a2a32] text-neutral-400 hover:text-neutral-200'
                        }`}
                      title={isHidden ? 'Show suggestion' : 'Hide suggestion'}
                    >
                      {isHidden ? (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>

                    {/* Dismiss / Check Button */}
                    <button
                      onClick={() => handleDismiss(sugg._id)}
                      className="p-1.5 rounded-lg text-xs bg-[#2a2a32] text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors"
                      title={isHidden ? 'Accepted' : 'Dismiss suggestion'}
                    >
                      {isHidden ? (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Drop Suggestion Form / Button */}
            {showDropInput ? (
              <form onSubmit={handleSendSuggestion} className="mt-2 bg-[#202025] p-3 rounded-xl border border-neutral-700">
                <textarea
                  rows={2}
                  maxLength={160}
                  value={suggestionText}
                  onChange={(e) => setSuggestionText(e.target.value)}
                  placeholder="Drop a topic, question, or icebreaker..."
                  className="w-full bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none resize-none"
                  autoFocus
                />
                <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-neutral-700/60">
                  <button
                    type="button"
                    onClick={() => setShowDropInput(false)}
                    className="text-[11px] text-neutral-400 hover:text-white px-2 py-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!suggestionText.trim() || submittingSugg}
                    className="bg-[#b91c1c] hover:bg-red-700 text-white text-[11px] font-bold px-3 py-1 rounded-lg disabled:opacity-50"
                  >
                    {submittingSugg ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowDropInput(true)}
                className="mt-2 w-full py-2 px-3 rounded-xl border border-[#b91c1c] text-[#f87171] hover:bg-[#b91c1c]/10 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>+</span>
                <span>Drop a Suggestion</span>
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

