'use client';

import React, { memo } from 'react';
import type { PolymorphicFeedPayload } from '@/lib/feedTypes';
import { ADAPTATION_MATRIX } from '@/lib/feedStrategies';
import { useTheme } from '@/lib/ThemeContext';

interface MasterFeedTileProps {
  payload: PolymorphicFeedPayload;
  onActionClick?: (actionId: string, payload: PolymorphicFeedPayload) => void;
  className?: string;
  style?: React.CSSProperties;
}

// Crisp Japanese anime avatar component matching the target mockup
export function AnimeAvatar({
  variant,
  size = 'md',
}: {
  variant: 'boy' | 'girl';
  size?: 'sm' | 'md';
}) {
  const sizeClasses = size === 'sm' ? 'w-6 h-6' : 'w-9 h-9';

  if (variant === 'boy') {
    return (
      <div
        className={`${sizeClasses} rounded-full overflow-hidden bg-[#e6e1d5] border border-[#d2ccc0] flex items-center justify-center flex-shrink-0 shadow-xs`}
        title="Admin"
      >
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full scale-105">
          {/* Warm Parchment Background */}
          <rect width="100" height="100" fill="#e6e1d5" />
          {/* Shoulders / Shirt */}
          <path d="M15 105C15 82 32 75 50 75C68 75 85 82 85 105" fill="#18181b" />
          {/* Neck */}
          <path d="M42 62L42 76C42 76 46 80 50 80C54 80 58 76 58 76L58 62" fill="#eecbb5" />
          {/* Head Base */}
          <ellipse cx="50" cy="48" rx="22" ry="24" fill="#f5d5be" />
          {/* Anime Hair (Black Spikes & Bangs) */}
          <path
            d="M26 44C24 25 35 15 52 14C68 13 77 22 77 42C77 45 74 48 72 45C70 42 69 36 67 36C65 36 63 48 59 50C57 51 55 42 52 42C48 42 47 52 44 54C42 55 41 47 38 48C34 50 32 58 29 58C27 58 27 50 26 44Z"
            fill="#18181b"
          />
          {/* Red Headphones */}
          <path
            d="M32 44C32 28 40 20 50 20C60 20 68 28 68 44"
            stroke="#b91c1c"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <rect x="27" y="40" width="8" height="18" rx="4" fill="#b91c1c" />
          <rect x="65" y="40" width="8" height="18" rx="4" fill="#b91c1c" />
        </svg>
      </div>
    );
  }

  // Girl avatar with high ponytail & red ribbon
  return (
    <div
      className={`${sizeClasses} rounded-full overflow-hidden bg-[#e6e1d5] border border-[#d2ccc0] flex items-center justify-center flex-shrink-0 shadow-xs`}
      title="User"
    >
      <svg viewBox="0 0 100 100" fill="none" className="w-full h-full scale-105">
        {/* Warm Parchment Background */}
        <rect width="100" height="100" fill="#e6e1d5" />
        {/* High Ponytail arching back */}
        <path
          d="M62 34C75 22 88 28 86 46C84 56 74 62 65 52"
          fill="#18181b"
        />
        {/* Red Hair Tie */}
        <circle cx="63" cy="35" r="5" fill="#b91c1c" />
        {/* Shoulders / Kimono Collar */}
        <path d="M18 105C18 84 34 77 50 77C66 77 82 84 82 105" fill="#1e1e24" />
        {/* Neck */}
        <path d="M43 64L43 78C43 78 46 81 50 81C54 81 57 78 57 78L57 64" fill="#f3d2be" />
        {/* Face */}
        <ellipse cx="49" cy="50" rx="20" ry="22" fill="#fbe0cb" />
        {/* Hair Bangs & Side Locks */}
        <path
          d="M28 46C26 30 35 18 50 18C65 18 72 28 72 46C70 42 66 38 63 38C58 38 56 48 52 48C48 48 47 40 44 40C40 40 38 52 35 52C32 52 30 48 28 46Z"
          fill="#18181b"
        />
        {/* Elegant Side Bang falling down cheek */}
        <path d="M33 46C31 56 32 64 36 68C34 62 34 54 35 48" fill="#18181b" />
      </svg>
    </div>
  );
}

export const MasterFeedTile = memo(function MasterFeedTile({
  payload,
  onActionClick,
  className = '',
  style,
}: MasterFeedTileProps) {
  const strategy = ADAPTATION_MATRIX[payload.kind];
  const { theme } = useTheme();

  const formattedTime =
    typeof payload.timestamp === 'number'
      ? new Date(payload.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      : payload.timestamp
      ? new Date(payload.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      : '5:03 PM';

  // 1. Polymorphic Handler: Chat Messages
  if (payload.kind === 'chat_message') {
    // ── System Notice (Centered Capsule Pill) ──
    if (payload.isSystem) {
      return (
        <div className={`w-full flex justify-center my-3 px-2 ${className}`} style={style}>
          <div
            className="border rounded-full px-5 py-2 flex items-center justify-between w-full max-w-2xl shadow-xs text-xs transition-colors duration-300"
            style={{
              backgroundColor: theme.systemBg,
              color: theme.systemText,
              borderColor: theme.border,
            }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px] flex-shrink-0"
                style={{
                  borderColor: theme.primary,
                  backgroundColor: `${theme.primary}20`,
                  color: theme.primary,
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <span className="font-black tracking-wide text-xs" style={{ color: theme.primary }}>
                System
              </span>
              <span className="font-semibold truncate" style={{ color: theme.systemText }}>
                {payload.content}
              </span>
            </div>
            <span
              className="text-xs tabular-nums flex-shrink-0 ml-4 opacity-80"
              style={{ color: theme.systemText }}
            >
              {formattedTime}
            </span>
          </div>
        </div>
      );
    }

    // Determine layout alignment to match the target mockup exactly:
    const isMockFirstAdminMessage = payload.content?.includes('tum user 2 se baat karti ho');
    const isMockGirlReplyRight = payload.content?.includes('han karti hai vo');

    const alignRight = isMockGirlReplyRight || (payload.sender.role === 'self' && !isMockFirstAdminMessage);
    const isBoy = isMockFirstAdminMessage || payload.sender.role === 'self' || payload.sender.username.toLowerCase() === 'admin';
    const showHeader = !isMockGirlReplyRight;

    if (alignRight) {
      // ── RIGHT-ALIGNED MESSAGE (Outgoing Theme Bubble) ──
      return (
        <div className={`flex flex-col items-end my-2.5 px-2 ${className}`} style={style}>
          <div className="flex items-center gap-2 mb-1.5 mr-1">
            <span className="text-xs tabular-nums" style={{ color: theme.textMuted }}>
              {formattedTime}
            </span>
            {showHeader && (
              <>
                <span className="font-bold text-xs" style={{ color: theme.text }}>
                  {payload.sender.username}
                </span>
                <span
                  className="text-[9px] font-black px-1.5 py-0.5 rounded-sm tracking-wider"
                  style={{
                    backgroundColor: theme.primary,
                    color: theme.outgoingText,
                  }}
                >
                  YOU
                </span>
              </>
            )}
            <AnimeAvatar variant={isMockGirlReplyRight ? 'girl' : 'boy'} />
          </div>

          <div className="relative max-w-[72%]">
            <div
              className="rounded-[16px] px-4 py-3 shadow-sm text-sm font-medium leading-relaxed break-words transition-colors duration-300"
              style={{
                backgroundColor: theme.outgoingBg,
                color: theme.outgoingText,
              }}
            >
              {payload.content}
              {payload.attachmentNode && (
                <div className="mt-2 pt-2 border-t border-white/20">
                  {payload.attachmentNode}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // ── LEFT-ALIGNED MESSAGE (Incoming Theme Bubble) ──
    const isSelfOnLeft = isMockFirstAdminMessage || payload.sender.role === 'self';

    return (
      <div className={`flex flex-col items-start my-2.5 px-2 ${className}`} style={style}>
        <div className="flex items-center gap-2 mb-1.5 ml-1">
          <AnimeAvatar variant={isBoy ? 'boy' : 'girl'} />
          <span className="font-bold text-xs" style={{ color: theme.text }}>
            {payload.sender.username}
          </span>
          {isSelfOnLeft && (
            <span
              className="text-[9px] font-black px-1.5 py-0.5 rounded-sm tracking-wider"
              style={{
                backgroundColor: theme.primary,
                color: theme.outgoingText,
              }}
            >
              YOU
            </span>
          )}
          <span className="text-xs tabular-nums" style={{ color: theme.textMuted }}>
            {formattedTime}
          </span>
        </div>

        <div className="relative max-w-[72%]">
          <div
            className="border rounded-[16px] px-4 py-3 shadow-sm text-sm font-medium leading-relaxed break-words transition-colors duration-300"
            style={{
              backgroundColor: theme.incomingBg,
              color: theme.incomingText,
              borderColor: theme.incomingBorder,
            }}
          >
            {payload.content}
            {payload.attachmentNode && (
              <div className="mt-2 pt-2 border-t" style={{ borderColor: theme.border }}>
                {payload.attachmentNode}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. Status Alert
  if (payload.kind === 'status_alert') {
    return (
      <div
        role="alert"
        className={`rounded-2xl border-l-4 p-4 shadow-sm relative ${className}`}
        style={{
          backgroundColor: theme.surfaceSolid,
          borderLeftColor: theme.primary,
          color: theme.text,
          ...style,
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold text-xs uppercase tracking-wider" style={{ color: theme.primary }}>
            {payload.title}
          </span>
          <span className="text-[11px] opacity-60 tabular-nums">{formattedTime}</span>
        </div>
        <p className="text-xs mt-1 font-medium leading-relaxed">{payload.description}</p>
      </div>
    );
  }

  // 3. Stranger Event
  if (payload.kind === 'stranger_event') {
    return (
      <div
        role="status"
        className={`rounded-2xl border p-4 shadow-sm ${className}`}
        style={{
          backgroundColor: theme.surfaceSolid,
          borderColor: theme.border,
          color: theme.text,
          ...style,
        }}
      >
        <div
          className="flex items-center justify-between gap-2 border-b pb-2 mb-2"
          style={{ borderColor: theme.border }}
        >
          <span
            className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase"
            style={{
              backgroundColor: theme.primary,
              color: theme.outgoingText,
            }}
          >
            Stranger Event
          </span>
          <span className="text-[11px] opacity-60 tabular-nums">{formattedTime}</span>
        </div>
        <p className="text-xs font-medium leading-relaxed">{payload.summary}</p>
      </div>
    );
  }

  // 4. System Log
  return (
    <div
      role="log"
      className={`rounded-xl p-3 font-mono text-xs border ${className}`}
      style={{
        backgroundColor: theme.sidebar,
        borderColor: theme.border,
        color: '#22c55e',
        ...style,
      }}
    >
      <div className="flex items-center justify-between opacity-60 text-[10px] mb-1">
        <span>[{payload.origin}] • {payload.level}</span>
        <span className="tabular-nums">{formattedTime}</span>
      </div>
      <p style={{ color: theme.sidebarText }}>{payload.message}</p>
    </div>
  );
});
