'use client';

import React from 'react';
import { useTheme } from '@/lib/ThemeContext';

interface MobileAppleDockProps {
  onOpenVoice: () => void;
  onOpenSuggestions: () => void;
  onOpenRooms: () => void;
  onOpenMatch: () => void;
  isInVoice?: boolean;
  suggestionsCount?: number;
}

export default function MobileAppleDock({
  onOpenVoice,
  onOpenSuggestions,
  onOpenRooms,
  onOpenMatch,
  isInVoice = false,
  suggestionsCount = 3,
}: MobileAppleDockProps) {
  const { theme } = useTheme();

  return (
    <div className="flex md:hidden items-center justify-between gap-1.5 px-3 py-1.5 z-20 select-none overflow-x-auto no-scrollbar">
      {/* 1. Voice Pill */}
      <button
        type="button"
        onClick={onOpenVoice}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm backdrop-blur-xl text-xs font-semibold tracking-tight transition-transform active:scale-95 shrink-0"
        style={{
          backgroundColor: isInVoice ? '#166534CC' : `${theme.surfaceSolid}CC`,
          borderColor: isInVoice ? '#22c55e60' : theme.border,
          color: isInVoice ? '#ffffff' : theme.text,
        }}
      >
        <span className="relative flex h-2 w-2">
          {isInVoice ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </>
          ) : (
            <span className="relative inline-flex rounded-full h-2 w-2 opacity-40 bg-neutral-400" />
          )}
        </span>
        <span>{isInVoice ? 'In Voice' : 'Voice'}</span>
      </button>

      {/* 2. Suggestions Pill */}
      <button
        type="button"
        onClick={onOpenSuggestions}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm backdrop-blur-xl text-xs font-semibold tracking-tight transition-transform active:scale-95 shrink-0"
        style={{
          backgroundColor: `${theme.surfaceSolid}CC`,
          borderColor: theme.border,
          color: theme.text,
        }}
      >
        <span>💡</span>
        <span>Ideas</span>
        <span
          className="text-[10px] font-bold px-1.5 py-0.2 rounded-full"
          style={{
            backgroundColor: `${theme.primary}30`,
            color: theme.primary,
          }}
        >
          {suggestionsCount}
        </span>
      </button>

      {/* 3. Rooms Pill */}
      <button
        type="button"
        onClick={onOpenRooms}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm backdrop-blur-xl text-xs font-semibold tracking-tight transition-transform active:scale-95 shrink-0"
        style={{
          backgroundColor: `${theme.surfaceSolid}CC`,
          borderColor: theme.border,
          color: theme.text,
        }}
      >
        <span className="opacity-60 font-mono">#</span>
        <span>Rooms</span>
      </button>

      {/* 4. Match Radar Pill */}
      <button
        type="button"
        onClick={onOpenMatch}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm backdrop-blur-xl text-xs font-semibold tracking-tight transition-transform active:scale-95 shrink-0"
        style={{
          backgroundColor: `${theme.primary}25`,
          borderColor: `${theme.primary}50`,
          color: theme.primary,
        }}
      >
        <span>⚡</span>
        <span>Next</span>
      </button>
    </div>
  );
}

