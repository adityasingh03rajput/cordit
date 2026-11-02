'use client';

import React from 'react';

interface LeftNavigationProps {
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
  onOpenRooms?: () => void;
  onOpenMatch?: () => void;
  onOpenWallpapers?: () => void;
}

export default function LeftNavigation({
  activeTab = 'stranger_chat',
  onSelectTab,
  onOpenRooms,
  onOpenMatch,
  onOpenWallpapers,
}: LeftNavigationProps) {
  return (
    <aside className="w-16 lg:w-[220px] flex-shrink-0 flex flex-col justify-between select-none relative z-10 bg-transparent h-full transition-all duration-200">
      {/* ── TOP: FLOATING DARK CARD (width: 72px / 220px, bg: #171616, text: #F7F1EB, p: 20px 14px, rounded-r-[20px]) ── */}
      <div className="flex flex-col p-3 lg:p-[20px_14px] bg-[#171616] text-[#F7F1EB] rounded-2xl rounded-l-none border-r border-b border-neutral-800/80 shadow-2xl">
        {/* Navigation Menu Links */}
        <nav className="flex flex-col gap-2">
          {/* HOME */}
          <button
            onClick={() => onSelectTab?.('home')}
            className={`w-full h-[44px] flex items-center justify-center lg:justify-start gap-3.5 px-3 lg:px-3.5 rounded-[10px] font-bold text-xs tracking-wider transition-all text-left ${
              activeTab === 'home'
                ? 'bg-[#C51F26] text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
            }`}
            title="Home"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span className="hidden lg:inline">HOME</span>
          </button>

          {/* STRANGER CHAT (ACTIVE) */}
          <button
            onClick={() => {
              onSelectTab?.('stranger_chat');
              onOpenMatch?.();
            }}
            className={`w-full h-[44px] flex items-center justify-center lg:justify-start gap-3.5 px-3 lg:px-3.5 rounded-[10px] font-bold text-xs tracking-wider transition-all text-left ${
              activeTab === 'stranger_chat'
                ? 'bg-[#C51F26] text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
            }`}
            title="Stranger Chat"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span className="hidden lg:inline">STRANGER CHAT</span>
          </button>

          {/* ROOMS */}
          <button
            onClick={() => onOpenRooms?.()}
            className={`w-full h-[44px] flex items-center justify-center lg:justify-start gap-3.5 px-3 lg:px-3.5 rounded-[10px] font-bold text-xs tracking-wider transition-all text-left ${
              activeTab === 'rooms'
                ? 'bg-[#C51F26] text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
            }`}
            title="Rooms"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
              <line x1="4" y1="9" x2="20" y2="9" />
              <line x1="4" y1="15" x2="20" y2="15" />
              <line x1="10" y1="3" x2="8" y2="21" />
              <line x1="16" y1="3" x2="14" y2="21" />
            </svg>
            <span className="hidden lg:inline">ROOMS</span>
          </button>

          {/* VOICE ROOMS */}
          <button
            onClick={() => onSelectTab?.('voice_rooms')}
            className={`w-full h-[44px] flex items-center justify-center lg:justify-start gap-3.5 px-3 lg:px-3.5 rounded-[10px] font-bold text-xs tracking-wider transition-all text-left ${
              activeTab === 'voice_rooms'
                ? 'bg-[#C51F26] text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
            }`}
            title="Voice Rooms"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
            <span className="hidden lg:inline">VOICE ROOMS</span>
          </button>

          {/* LIBRARY (WALLPAPERS) */}
          <button
            onClick={() => {
              onSelectTab?.('library');
              onOpenWallpapers?.();
            }}
            className={`w-full h-[44px] flex items-center justify-center lg:justify-start gap-3.5 px-3 lg:px-3.5 rounded-[10px] font-bold text-xs tracking-wider transition-all text-left ${
              activeTab === 'library'
                ? 'bg-[#C51F26] text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
            }`}
            title="Library"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
              <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
            </svg>
            <span className="hidden lg:inline">LIBRARY</span>
          </button>
        </nav>
      </div>

      {/* ── BOTTOM AREA: 100% UNBLOCKED FOR UNDERLYING WALLPAPER ARTWORK ── */}
      <div className="flex-1 min-h-[260px] pointer-events-none" />
    </aside>
  );
}
