'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { useSocket } from '@/lib/useSocket';
import { useTheme } from '@/lib/ThemeContext';

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
  const { currentRoom, suggestions } = useStore();
  const { toggleSuggestionVisibility, sendSuggestion } = useSocket();
  const { theme } = useTheme();

  const [isVoiceCollapsed, setIsVoiceCollapsed] = useState(false);
  const [isSuggestionsCollapsed, setIsSuggestionsCollapsed] = useState(false);
  const [showDropInput, setShowDropInput] = useState(false);
  const [suggestionText, setSuggestionText] = useState('');
  const [submittingSugg, setSubmittingSugg] = useState(false);

  // Hidden state per user locally
  const [hiddenSuggestions, setHiddenSuggestions] = useState<Record<string, boolean>>({
    'mock-2': true,
  });

  const handleToggleEye = (suggId: string) => {
    const isCurrentlyHidden = !!hiddenSuggestions[suggId];
    setHiddenSuggestions((prev) => ({ ...prev, [suggId]: !isCurrentlyHidden }));
    toggleSuggestionVisibility(suggId, isCurrentlyHidden);
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

  // Mock placeholder suggestions matching mockup
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

  // Dynamic audio waveform pattern adapting to theme colors
  const waveBars = [
    { height: '16px', color: theme.wavePrimary },
    { height: '26px', color: theme.waveSecondary },
    { height: '42px', color: theme.wavePrimary },
    { height: '22px', color: theme.waveSecondary },
    { height: '34px', color: theme.wavePrimary },
    { height: '50px', color: theme.waveSecondary },
    { height: '58px', color: theme.wavePrimary },
    { height: '40px', color: theme.waveSecondary },
    { height: '46px', color: theme.wavePrimary },
    { height: '26px', color: theme.waveSecondary },
    { height: '36px', color: theme.wavePrimary },
    { height: '20px', color: theme.waveSecondary },
    { height: '28px', color: theme.wavePrimary },
    { height: '14px', color: theme.waveSecondary },
  ];

  return (
    <aside className="w-[300px] flex-shrink-0 flex flex-col gap-4 select-none overflow-y-auto z-10 transition-colors duration-300">
      {/* ── CARD 1: VOICE CHAT (Order 1, minHeight 180px) ── */}
      <div
        className="order-1 min-h-[180px] rounded-[18px] p-4 border shadow-sm transition-colors duration-300"
        style={{
          backgroundColor: theme.surfaceSolid,
          borderColor: theme.border,
          color: theme.text,
        }}
      >
        <header
          className="flex items-center justify-between pb-3 border-b"
          style={{ borderColor: theme.border }}
        >
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: theme.text }}>
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
            <h3 className="font-bold text-sm tracking-wide" style={{ color: theme.text }}>
              Voice Chat
            </h3>
          </div>
          <button
            onClick={() => setIsVoiceCollapsed(!isVoiceCollapsed)}
            className="p-1 text-xs hover:opacity-100 opacity-60 transition-opacity"
            style={{ color: theme.text }}
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
                  className={`w-1 rounded-full transition-all duration-300 ${isInVoice ? 'animate-pulse' : ''}`}
                  style={{
                    height: bar.height,
                    backgroundColor: bar.color,
                    opacity: isInVoice ? 1 : 0.85,
                  }}
                />
              ))}
            </div>

            <p className="text-xs font-medium mt-1 mb-4 text-center" style={{ color: theme.textMuted }}>
              {isInVoice ? 'Connected to voice' : 'No one in voice yet'}
            </p>

            <button
              onClick={isInVoice ? onLeaveVoice : onJoinVoice}
              disabled={connectingVoice}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
              style={{
                backgroundColor: isInVoice ? theme.sidebar : theme.primary,
                color: theme.outgoingText,
              }}
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

      {/* ── CARD 2: SUGGESTIONS (Order 2, minHeight 260px) ── */}
      <div
        className="order-2 min-h-[260px] rounded-[18px] p-4 border shadow-sm transition-colors duration-300"
        style={{
          backgroundColor: theme.surfaceSolid,
          borderColor: theme.border,
          color: theme.text,
        }}
      >
        <header
          className="flex items-center justify-between pb-3 border-b"
          style={{ borderColor: theme.border }}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">💡</span>
            <h3 className="font-bold text-sm tracking-wide" style={{ color: theme.text }}>
              Suggestions ({displaySuggestions.length})
            </h3>
          </div>
          <button
            onClick={() => setIsSuggestionsCollapsed(!isSuggestionsCollapsed)}
            className="p-1 text-xs hover:opacity-100 opacity-60 transition-opacity"
            style={{ color: theme.text }}
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
                  className={`rounded-xl p-3 flex items-start justify-between gap-2.5 border transition-all shadow-2xs ${
                    isHidden ? 'opacity-40' : ''
                  }`}
                  style={{
                    backgroundColor: theme.incomingBg,
                    borderColor: theme.incomingBorder,
                  }}
                >
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="text-amber-500 text-xs mt-0.5 flex-shrink-0">💡</span>
                    <div className="min-w-0">
                      <p
                        className={`text-xs font-semibold leading-snug break-words ${
                          isHidden ? 'line-through opacity-60' : ''
                        }`}
                        style={{ color: theme.incomingText }}
                      >
                        {sugg.content}
                      </p>
                      <p className="text-[10px] mt-1 truncate" style={{ color: theme.textMuted }}>
                        by #{sugg.observerPublicId} • {timeStr}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-1">
                    {/* Visibility Toggle Eye */}
                    <button
                      onClick={() => handleToggleEye(sugg._id)}
                      className="p-1.5 rounded-lg text-xs transition-all hover:scale-105"
                      style={{
                        backgroundColor: !isHidden ? theme.primary : theme.surfaceMuted,
                        color: !isHidden ? theme.outgoingText : theme.textMuted,
                      }}
                      title={isHidden ? 'Show suggestion' : 'Hide suggestion'}
                    >
                      {isHidden ? (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>

                    {/* Dismiss / Check Button */}
                    <button
                      onClick={() => handleDismiss(sugg._id)}
                      className="p-1.5 rounded-lg text-xs transition-colors hover:opacity-80"
                      style={{
                        backgroundColor: theme.sidebar,
                        color: theme.sidebarText,
                      }}
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
              <form
                onSubmit={handleSendSuggestion}
                className="mt-2 p-3 rounded-xl border shadow-xs"
                style={{
                  backgroundColor: theme.incomingBg,
                  borderColor: theme.border,
                }}
              >
                <textarea
                  rows={2}
                  maxLength={160}
                  value={suggestionText}
                  onChange={(e) => setSuggestionText(e.target.value)}
                  placeholder="Drop a topic, question, or icebreaker..."
                  className="w-full bg-transparent text-xs focus:outline-none resize-none font-medium"
                  style={{
                    color: theme.text,
                  }}
                  autoFocus
                />
                <div className="flex justify-end gap-2 mt-2 pt-2 border-t" style={{ borderColor: theme.border }}>
                  <button
                    type="button"
                    onClick={() => setShowDropInput(false)}
                    className="text-[11px] px-2 py-1 font-semibold hover:opacity-80"
                    style={{ color: theme.textMuted }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!suggestionText.trim() || submittingSugg}
                    className="text-[11px] font-bold px-3 py-1 rounded-lg disabled:opacity-50 transition-all"
                    style={{
                      backgroundColor: theme.primary,
                      color: theme.outgoingText,
                    }}
                  >
                    {submittingSugg ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowDropInput(true)}
                className="mt-2 w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all hover:scale-101"
                style={{
                  borderColor: theme.primary,
                  color: theme.primary,
                  backgroundColor: `${theme.primary}12`,
                }}
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
