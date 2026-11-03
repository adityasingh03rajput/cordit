'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { AnimeAvatar } from './MasterFeedTile';
import { useTheme } from '@/lib/ThemeContext';

interface TopHeaderProps {
  onOpenWallpapers?: () => void;
}

export default function TopHeader({ onOpenWallpapers }: TopHeaderProps) {
  const router = useRouter();
  const { user, isConnected, logout } = useStore();
  const { theme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header
      className="h-16 w-full px-6 flex items-center justify-between select-none backdrop-blur-md border-b z-20 flex-shrink-0 transition-colors duration-300"
      style={{
        backgroundColor: theme.surface,
        borderColor: theme.border,
      }}
    >
      {/* ── LEFT: LOGO (width: 180px) ── */}
      <div className="w-[180px] flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shadow-xs transition-colors"
            style={{ backgroundColor: theme.primary }}
          >
            <span
              className="font-serif font-black text-lg leading-none"
              style={{ color: theme.outgoingText }}
            >
              C
            </span>
          </div>
          <span
            className="font-serif font-bold text-2xl tracking-tight transition-colors"
            style={{ color: theme.text }}
          >
            Cordit
          </span>
        </div>

        <div className="flex items-center gap-1.5 ml-1">
          <span
            className={`w-2 h-2 rounded-full ${isConnected ? 'animate-pulse' : 'opacity-40'}`}
            style={{ backgroundColor: isConnected ? theme.primary : theme.textMuted }}
          />
          <span
            className="text-[10px] font-black tracking-widest uppercase transition-colors"
            style={{ color: isConnected ? theme.primary : theme.textMuted }}
          >
            {isConnected ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* ── RIGHT: ACTIONS (gap: 12px) ── */}
      <div className="flex items-center gap-3">
        {/* Wallpaper & Theme Gallery Trigger */}
        <button
          onClick={onOpenWallpapers}
          className="border text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs transition-all hover:scale-102"
          style={{
            backgroundColor: theme.surfaceSolid,
            borderColor: theme.border,
            color: theme.text,
          }}
          title="Switch Wallpaper & Theme"
        >
          <span className="text-sm">🖼️</span>
          <span className="hidden sm:inline">Theme</span>
        </button>

        {/* Notification Bell */}
        <div
          className="relative cursor-pointer p-2 transition-colors rounded-xl hover:opacity-80"
          style={{ color: theme.text }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span
            className="absolute top-1 right-1 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center leading-none shadow-xs"
            style={{ backgroundColor: theme.primary, color: theme.outgoingText }}
          >
            1
          </span>
        </div>

        {/* User Profile Pill Container */}
        <div className="relative">
          <div
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="border rounded-full px-3 py-1 flex items-center gap-2 shadow-2xs cursor-pointer hover:opacity-90 transition-all"
            style={{
              backgroundColor: theme.surfaceSolid,
              borderColor: theme.border,
            }}
          >
            <AnimeAvatar variant="boy" size="sm" />

            <span className="font-bold text-xs" style={{ color: theme.text }}>
              #{user?.publicId || '7368'} • {user?.username ? user.username.charAt(0).toUpperCase() + user.username.slice(1) : 'Admin'}
            </span>

            <span className="text-xs" style={{ color: theme.textMuted }}>⌄</span>
          </div>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div
              className="absolute right-0 mt-2 w-48 border rounded-xl shadow-xl py-2 z-50 text-xs font-medium"
              style={{
                backgroundColor: theme.surfaceSolid,
                borderColor: theme.border,
                color: theme.text,
              }}
            >
              <div
                className="px-3 py-1.5 border-b font-bold text-[10px] uppercase"
                style={{
                  borderColor: theme.border,
                  color: theme.textMuted,
                }}
              >
                Signed in as #{user?.publicId}
              </div>
              {user?.role === 'admin' && (
                <button
                  onClick={() => {
                    router.push('/admin');
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 font-bold hover:opacity-80"
                  style={{ color: theme.text }}
                >
                  Admin Dashboard
                </button>
              )}
              <button
                onClick={() => {
                  logout();
                  setShowProfileMenu(false);
                }}
                className="w-full text-left px-3 py-2 font-bold hover:opacity-80"
                style={{ color: theme.primary }}
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
