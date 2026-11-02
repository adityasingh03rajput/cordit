'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { AnimeAvatar } from './MasterFeedTile';

interface TopHeaderProps {
  onReport?: () => void;
  onLeave?: () => void;
  onBlock?: () => void;
  onToggleRooms?: () => void;
}

export default function TopHeader({
  onReport,
  onLeave,
  onBlock,
  onToggleRooms,
}: TopHeaderProps) {
  const router = useRouter();
  const { user, currentRoom, matchedPartner, userRoleInCurrentRoom, logout } = useStore();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Extract public IDs from room name or partner
  const roomName = currentRoom?.name || 'Stranger Chat #7368 & #6202';
  const tagMatch = roomName.match(/#(\d+)\s*&\s*#(\d+)/);
  const roomTag = tagMatch ? `#${tagMatch[1]} & #${tagMatch[2]}` : (user?.publicId && matchedPartner?.publicId) ? `#${user.publicId} & #${matchedPartner.publicId}` : '#7368 & #6202';

  const observerCount = currentRoom?.observerCount ?? 4;

  return (
    <header className="h-16 px-6 flex items-center justify-between select-none border-b border-[#e5e0d5]/60 z-10 flex-shrink-0">
      {/* ── LEFT: TITLE & STATUS PILLS ── */}
      <div className="flex items-center gap-3.5 flex-wrap">
        {/* Title with Crimson Underline */}
        <div className="flex flex-col">
          <h2 className="text-xl font-bold tracking-tight text-[#18181b] flex items-center gap-1.5">
            <span className="text-[#18181b]">#</span>
            <span>Stranger Chat</span>
          </h2>
          <div className="h-[3px] bg-[#b91c1c] w-full rounded-full mt-0.5" />
        </div>

        {/* Room Partners Tag Pill [ #7368 & #6202 ] */}
        <div className="border border-neutral-300/80 bg-white/70 backdrop-blur-xs font-mono font-bold text-xs px-3 py-1 rounded-md text-neutral-800 shadow-xs">
          {roomTag}
        </div>

        {/* PUBLIC ROOM Badge */}
        <div className="bg-[#b91c1c] text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <span className="tracking-wide">PUBLIC ROOM</span>
        </div>

        {/* Observer Count Pill */}
        <div className="border border-neutral-300/80 bg-white/70 backdrop-blur-xs text-xs font-medium px-3 py-1 rounded-full text-neutral-800 flex items-center gap-1.5 shadow-xs">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-700">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span>{observerCount} Observers</span>
        </div>

        {/* 3-Dots More Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="text-neutral-600 hover:text-black p-1 text-sm font-bold"
            title="More options"
          >
            ⋮
          </button>
          {showMoreMenu && (
            <div className="absolute left-0 mt-2 w-44 bg-white border border-neutral-200 rounded-xl shadow-lg py-1.5 z-50 text-xs font-medium">
              <button
                onClick={() => {
                  onToggleRooms?.();
                  setShowMoreMenu(false);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-neutral-100 flex items-center gap-2"
              >
                <span>#</span>
                <span>Switch Room</span>
              </button>
              {matchedPartner && (
                <button
                  onClick={() => {
                    onBlock?.();
                    setShowMoreMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600 flex items-center gap-2"
                >
                  <span>🚫</span>
                  <span>Block #{matchedPartner.publicId}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Report Button */}
        <button
          onClick={onReport}
          className="text-neutral-700 hover:text-red-700 font-bold text-xs flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-white/60 transition-colors"
        >
          <span className="text-red-600">🚩</span>
          <span>Report</span>
        </button>

        {/* Leave Button */}
        <button
          onClick={onLeave}
          className="text-neutral-700 hover:text-red-700 font-bold text-xs flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-white/60 transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Leave</span>
        </button>
      </div>

      {/* ── RIGHT: NOTIFICATIONS & USER PROFILE ── */}
      <div className="flex items-center gap-4">
        {/* Notification Bell with Badge */}
        <div className="relative cursor-pointer p-1.5 text-neutral-700 hover:text-black">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="absolute top-0.5 right-0.5 bg-[#b91c1c] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center leading-none shadow-xs">
            1
          </span>
        </div>

        {/* User Profile Pill Container */}
        <div className="relative">
          <div
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="border border-neutral-300/80 bg-white/80 backdrop-blur-xs rounded-full px-3 py-1 flex items-center gap-2 shadow-xs cursor-pointer hover:bg-white transition-all"
          >
            {/* Small Anime Boy Avatar */}
            <AnimeAvatar variant="boy" size="sm" />

            <span className="font-bold text-xs text-neutral-800">
              #{user?.publicId || '7368'} • {user?.username ? user.username.charAt(0).toUpperCase() + user.username.slice(1) : 'Admin'}
            </span>

            <span className="text-neutral-500 text-xs">⌄</span>
          </div>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-neutral-200 rounded-xl shadow-xl py-2 z-50 text-xs font-medium">
              <div className="px-3 py-1.5 border-b border-neutral-100 text-neutral-500 font-bold text-[10px] uppercase">
                Signed in as #{user?.publicId}
              </div>
              {user?.role === 'admin' && (
                <button
                  onClick={() => {
                    router.push('/admin');
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-neutral-50 font-bold text-neutral-800"
                >
                  Admin Dashboard
                </button>
              )}
              <button
                onClick={() => {
                  logout();
                  setShowProfileMenu(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 font-bold"
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

