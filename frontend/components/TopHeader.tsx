'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { AnimeAvatar } from './MasterFeedTile';

interface TopHeaderProps {
  onOpenWallpapers?: () => void;
}

export default function TopHeader({ onOpenWallpapers }: TopHeaderProps) {
  const router = useRouter();
  const { user, isConnected, logout } = useStore();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="h-16 w-full px-6 flex items-center justify-between select-none bg-[#FFF9F2]/95 backdrop-blur-md border-b border-[#D8C9BC] z-20 flex-shrink-0">
      {/* ── LEFT: LOGO (width: 180px) ── */}
      <div className="w-[180px] flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#C51F26] flex items-center justify-center shadow-xs">
            <span className="font-serif font-black text-lg text-white leading-none">C</span>
          </div>
          <span className="font-serif font-bold text-2xl tracking-tight text-[#211D1B]">
            Cordit
          </span>
        </div>

        <div className="flex items-center gap-1.5 ml-1">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#C51F26] animate-pulse' : 'bg-neutral-400'}`} />
          <span className="text-[10px] font-black tracking-widest text-[#C51F26] uppercase">
            {isConnected ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* ── RIGHT: ACTIONS (gap: 12px) ── */}
      <div className="flex items-center gap-3">
        {/* Wallpaper Gallery Trigger */}
        <button
          onClick={onOpenWallpapers}
          className="border border-[#D8C9BC] bg-[#FFF9F2] hover:bg-white text-[#211D1B] text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs transition-all hover:scale-102"
          title="Switch Wallpaper"
        >
          <span className="text-sm">🖼️</span>
          <span className="hidden sm:inline">Wallpapers</span>
        </button>

        {/* Notification Bell */}
        <div className="relative cursor-pointer p-2 text-[#211D1B] hover:text-[#C51F26] transition-colors rounded-xl hover:bg-white/60">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="absolute top-1 right-1 bg-[#C51F26] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center leading-none shadow-xs">
            1
          </span>
        </div>

        {/* User Profile Pill Container */}
        <div className="relative">
          <div
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="border border-[#D8C9BC] bg-white rounded-full px-3 py-1 flex items-center gap-2 shadow-2xs cursor-pointer hover:bg-neutral-50 transition-all"
          >
            <AnimeAvatar variant="boy" size="sm" />

            <span className="font-bold text-xs text-[#211D1B]">
              #{user?.publicId || '7368'} • {user?.username ? user.username.charAt(0).toUpperCase() + user.username.slice(1) : 'Admin'}
            </span>

            <span className="text-[#81766F] text-xs">⌄</span>
          </div>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-[#FFF9F2] border border-[#D8C9BC] rounded-xl shadow-xl py-2 z-50 text-xs font-medium">
              <div className="px-3 py-1.5 border-b border-[#D8C9BC] text-[#81766F] font-bold text-[10px] uppercase">
                Signed in as #{user?.publicId}
              </div>
              {user?.role === 'admin' && (
                <button
                  onClick={() => {
                    router.push('/admin');
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#E8DED3] font-bold text-[#211D1B]"
                >
                  Admin Dashboard
                </button>
              )}
              <button
                onClick={() => {
                  logout();
                  setShowProfileMenu(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-red-50 text-[#C51F26] font-bold"
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
