'use client';

import React from 'react';
import { useStore } from '@/lib/store';

interface LeftNavigationProps {
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
  onOpenRooms?: () => void;
  onOpenMatch?: () => void;
}

export default function LeftNavigation({
  activeTab = 'stranger_chat',
  onSelectTab,
  onOpenRooms,
  onOpenMatch,
}: LeftNavigationProps) {
  const { isConnected } = useStore();

  return (
    <aside className="w-[230px] flex-shrink-0 h-screen bg-[#121214] text-white flex flex-col justify-between select-none border-r border-neutral-900 z-20">
      {/* ── TOP: BRAND LOGO & NAVIGATION ── */}
      <div className="flex flex-col p-5 pb-0">
        {/* Brand Logo */}
        <div className="mb-8">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-[#b91c1c] flex items-center justify-center shadow-sm">
                <span className="font-serif font-black text-lg text-white leading-none">C</span>
              </div>
            </div>
            <span className="font-serif font-bold text-2xl tracking-tight text-white">
              Cordit
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-1.5 ml-1">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#b91c1c] animate-pulse' : 'bg-neutral-600'}`} />
            <span className="text-[10px] font-bold tracking-widest text-[#ef4444] uppercase">
              {isConnected ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
        </div>

        {/* Navigation Menu Links */}
        <nav className="flex flex-col gap-1.5">
          {/* HOME */}
          <button
            onClick={() => onSelectTab?.('home')}
            className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-bold text-xs tracking-wider transition-all text-left ${activeTab === 'home'
                ? 'bg-[#b91c1c] text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
              }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>HOME</span>
          </button>

          {/* STRANGER CHAT (ACTIVE) */}
          <button
            onClick={() => {
              onSelectTab?.('stranger_chat');
              onOpenMatch?.();
            }}
            className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-bold text-xs tracking-wider transition-all text-left ${activeTab === 'stranger_chat'
                ? 'bg-[#b91c1c] text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
              }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>STRANGER CHAT</span>
          </button>

          {/* ROOMS */}
          <button
            onClick={() => onOpenRooms?.()}
            className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-bold text-xs tracking-wider transition-all text-left ${activeTab === 'rooms'
                ? 'bg-[#b91c1c] text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
              }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="9" x2="20" y2="9" />
              <line x1="4" y1="15" x2="20" y2="15" />
              <line x1="10" y1="3" x2="8" y2="21" />
              <line x1="16" y1="3" x2="14" y2="21" />
            </svg>
            <span>ROOMS</span>
          </button>

          {/* VOICE ROOMS */}
          <button
            onClick={() => onSelectTab?.('voice_rooms')}
            className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-bold text-xs tracking-wider transition-all text-left ${activeTab === 'voice_rooms'
                ? 'bg-[#b91c1c] text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
              }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
            <span>VOICE ROOMS</span>
          </button>

          {/* LIBRARY */}
          <button
            onClick={() => onSelectTab?.('library')}
            className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-bold text-xs tracking-wider transition-all text-left ${activeTab === 'library'
                ? 'bg-[#b91c1c] text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
              }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
            </svg>
            <span>LIBRARY</span>
          </button>
        </nav>
      </div>

      {/* ── BOTTOM: JAPANESE WALLPAPER ARTWORK ── */}
      <div className="relative w-full h-56 overflow-hidden select-none pointer-events-none mt-auto">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: "url('/wallpaper.jpg')",
            backgroundSize: '420px auto',
            backgroundPosition: 'bottom left',
            backgroundRepeat: 'no-repeat',
            maskImage: 'linear-gradient(to top, black 85%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to top, black 85%, transparent 100%)',
          }}
        />
      </div>
    </aside>
  );
}

