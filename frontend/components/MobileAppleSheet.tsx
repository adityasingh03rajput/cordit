'use client';

import React from 'react';
import { useTheme } from '@/lib/ThemeContext';
import { useStore } from '@/lib/store';
import { useSocket } from '@/lib/useSocket';
import type { Room } from '@/lib/types';

interface MobileAppleSheetProps {
  isOpen: boolean;
  activeSheet: 'voice' | 'suggestions' | 'rooms' | null;
  onClose: () => void;
  // Voice controls
  isInVoice?: boolean;
  connectingVoice?: boolean;
  onJoinVoice?: () => void;
  onLeaveVoice?: () => void;
  // Rooms controls
  rooms?: Room[];
  currentRoomId?: string | null;
  onSelectRoom?: (roomId: string) => void;
  // Suggestion controls
  suggestionsCount?: number;
}

export default function MobileAppleSheet({
  isOpen,
  activeSheet,
  onClose,
  isInVoice = false,
  connectingVoice = false,
  onJoinVoice,
  onLeaveVoice,
  rooms = [],
  currentRoomId,
  onSelectRoom,
}: MobileAppleSheetProps) {
  const { theme } = useTheme();
  const { currentRoom, suggestions } = useStore();
  const { toggleSuggestionVisibility, sendSuggestion } = useSocket();

  const [suggestionText, setSuggestionText] = React.useState('');
  const [submittingSugg, setSubmittingSugg] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(false);

  if (!isOpen || !activeSheet) return null;

  const handleSendSuggestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestionText.trim() || submittingSugg) return;
    setSubmittingSugg(true);
    try {
      sendSuggestion(suggestionText.trim());
      setSuggestionText('');
      onClose();
    } catch (err) {
      console.error('Failed to drop suggestion:', err);
    } finally {
      setSubmittingSugg(false);
    }
  };

  // Mock suggestions matching the right sidebar
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
    { height: '18px', color: theme.wavePrimary },
    { height: '32px', color: theme.waveSecondary },
    { height: '48px', color: theme.wavePrimary },
    { height: '24px', color: theme.waveSecondary },
    { height: '38px', color: theme.wavePrimary },
    { height: '56px', color: theme.waveSecondary },
    { height: '64px', color: theme.wavePrimary },
    { height: '44px', color: theme.waveSecondary },
    { height: '52px', color: theme.wavePrimary },
    { height: '28px', color: theme.waveSecondary },
    { height: '40px', color: theme.wavePrimary },
    { height: '22px', color: theme.waveSecondary },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden animate-fade-in">
      {/* Blurred Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Apple Squircle Bottom Sheet */}
      <div
        className="relative z-10 w-full max-h-[85vh] rounded-t-[32px] border-t p-5 pt-3 shadow-[0_-16px_48px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden transition-all duration-300 backdrop-blur-2xl"
        style={{
          backgroundColor: `${theme.surfaceSolid}F2`,
          borderColor: theme.border,
          color: theme.text,
        }}
      >
        {/* iOS Drag Handle */}
        <div className="w-10 h-1.5 rounded-full bg-white/30 mx-auto mb-3 cursor-grab" onClick={onClose} />

        {/* Sheet Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            {activeSheet === 'voice' && (
              <>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm"
                  style={{ backgroundColor: `${theme.primary}25`, color: theme.primary }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" x2="12" y1="19" y2="22" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-base tracking-tight leading-none" style={{ color: theme.text }}>
                    Voice Channel
                  </h3>
                  <p className="text-[11px] mt-0.5 opacity-70">Low-latency spatial audio</p>
                </div>
              </>
            )}

            {activeSheet === 'suggestions' && (
              <>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm"
                  style={{ backgroundColor: `${theme.primary}25`, color: theme.primary }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
                    <path d="M9 18h6" />
                    <path d="M10 22h4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-base tracking-tight leading-none" style={{ color: theme.text }}>
                    Spectator Ideas
                  </h3>
                  <p className="text-[11px] mt-0.5 opacity-70">Topics suggested by observers</p>
                </div>
              </>
            )}

            {activeSheet === 'rooms' && (
              <>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm"
                  style={{ backgroundColor: `${theme.primary}25`, color: theme.primary }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="9" x2="20" y2="9" />
                    <line x1="4" y1="15" x2="20" y2="15" />
                    <line x1="10" y1="3" x2="8" y2="21" />
                    <line x1="16" y1="3" x2="14" y2="21" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-base tracking-tight leading-none" style={{ color: theme.text }}>
                    Channels & Rooms
                  </h3>
                  <p className="text-[11px] mt-0.5 opacity-70">Browse public rooms</p>
                </div>
              </>
            )}
          </div>

          {/* Close Pill Button */}
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-xs transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Sheet Content Area */}
        <div className="overflow-y-auto flex-1 pb-4">
          {/* ── 1. VOICE TAB CONTENT ── */}
          {activeSheet === 'voice' && (
            <div className="flex flex-col gap-4">
              {/* Audio Waveform Stage */}
              <div
                className="rounded-2xl p-4 border flex flex-col items-center justify-center shadow-inner"
                style={{
                  backgroundColor: theme.sidebar,
                  borderColor: theme.border,
                }}
              >
                <div className="h-16 flex items-center justify-center gap-1.5 w-full px-2">
                  {waveBars.map((bar, i) => (
                    <div
                      key={i}
                      className={`w-1.5 rounded-full transition-all duration-300 ${
                        isInVoice ? 'animate-pulse' : ''
                      }`}
                      style={{
                        height: isInVoice ? bar.height : '8px',
                        backgroundColor: bar.color,
                        opacity: isInVoice ? 0.95 : 0.35,
                      }}
                    />
                  ))}
                </div>
                <p className="text-xs font-medium text-neutral-400 mt-2">
                  {isInVoice ? 'Voice connected • Speaking active' : 'No one speaking right now'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                {!isInVoice ? (
                  <button
                    onClick={() => {
                      onJoinVoice?.();
                      onClose();
                    }}
                    disabled={connectingVoice}
                    className="col-span-2 h-12 rounded-2xl font-bold text-sm text-white shadow-lg flex items-center justify-center gap-2 active:scale-98 transition-all"
                    style={{ backgroundColor: theme.primary }}
                  >
                    <span>{connectingVoice ? 'Connecting...' : 'Join Voice Chat'}</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" x2="12" y1="19" y2="22" />
                    </svg>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="h-12 rounded-2xl font-bold text-xs border flex items-center justify-center gap-2 active:scale-98 transition-all"
                      style={{
                        backgroundColor: isMuted ? '#b91c1c' : theme.surface,
                        borderColor: theme.border,
                        color: isMuted ? '#fff' : theme.text,
                      }}
                    >
                      <span>{isMuted ? '🔇 Unmute' : '🎤 Mute'}</span>
                    </button>
                    <button
                      onClick={() => {
                        onLeaveVoice?.();
                        onClose();
                      }}
                      className="h-12 rounded-2xl font-bold text-xs bg-red-600/90 text-white shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all"
                    >
                      <span>Leave Voice</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── 2. SUGGESTIONS TAB CONTENT ── */}
          {activeSheet === 'suggestions' && (
            <div className="flex flex-col gap-3">
              {/* Drop Suggestion Form */}
              <form onSubmit={handleSendSuggestion} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={suggestionText}
                  onChange={(e) => setSuggestionText(e.target.value)}
                  placeholder="Drop an icebreaker topic..."
                  className="flex-1 h-10 px-4 rounded-xl text-xs border outline-none bg-white/10 placeholder-white/40 text-white focus:border-white/40"
                  style={{ borderColor: theme.border }}
                />
                <button
                  type="submit"
                  disabled={!suggestionText.trim() || submittingSugg}
                  className="px-4 h-10 rounded-xl text-xs font-bold text-white transition-transform active:scale-95 disabled:opacity-40"
                  style={{ backgroundColor: theme.primary }}
                >
                  Send
                </button>
              </form>

              {/* Suggestions Cards */}
              <div className="flex flex-col gap-2">
                {displaySuggestions.map((sugg) => (
                  <div
                    key={sugg._id}
                    className="p-3.5 rounded-2xl border shadow-xs flex items-start justify-between gap-3"
                    style={{
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    }}
                  >
                    <div className="flex flex-col gap-1 min-w-0">
                      <p className="text-xs font-medium leading-relaxed" style={{ color: theme.text }}>
                        💡 {sugg.content}
                      </p>
                      <span className="text-[10px] opacity-60">
                        by #{sugg.observerPublicId}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleSuggestionVisibility(sugg._id, false)}
                      className="text-neutral-400 hover:text-white p-1 text-xs shrink-0"
                      title="Dismiss"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 3. ROOMS TAB CONTENT ── */}
          {activeSheet === 'rooms' && (
            <div className="flex flex-col gap-2">
              {rooms.map((room) => {
                const isSelected = room._id === currentRoomId;
                return (
                  <button
                    key={room._id}
                    onClick={() => {
                      onSelectRoom?.(room._id);
                      onClose();
                    }}
                    className="w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all active:scale-98"
                    style={{
                      backgroundColor: isSelected ? theme.primary : theme.surface,
                      color: isSelected ? theme.outgoingText : theme.text,
                      borderColor: theme.border,
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-sm">#</span>
                      <span className="font-semibold text-xs">{room.name}</span>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/20">
                        Active
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

