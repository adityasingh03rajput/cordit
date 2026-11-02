'use client';

import React, { memo } from 'react';
import type { PolymorphicFeedPayload } from '@/lib/feedTypes';
import { ADAPTATION_MATRIX } from '@/lib/feedStrategies';

interface MasterFeedTileProps {
  payload: PolymorphicFeedPayload;
  onActionClick?: (actionId: string, payload: PolymorphicFeedPayload) => void;
  className?: string;
  style?: React.CSSProperties;
}

// Stylized anime avatar component matching the aesthetic
function UserAvatar({ username, isSelf }: { username: string; isSelf: boolean }) {
  if (isSelf || username.toLowerCase() === 'admin') {
    // Anime boy avatar with headphones
    return (
      <div className="w-8 h-8 rounded-full bg-[#18181b] border border-neutral-700 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
        <svg viewBox="0 0 36 36" fill="none" className="w-full h-full">
          <rect width="36" height="36" fill="#1f1f23" />
          <circle cx="18" cy="15" r="7" fill="#f5d0b5" />
          <path d="M11 15C11 10 14 8 18 8C22 8 25 10 25 15C25 16 23 18 23 18L13 18C13 18 11 16 11 15Z" fill="#18181b" />
          <path d="M12 11C14 13 17 14 20 13C22 12.5 24 11 25 11C23 14 21 16 18 16C15 16 13 14 12 11Z" fill="#2d2d35" />
          {/* Headphones */}
          <path d="M9 15C9 10 13 6 18 6C23 6 27 10 27 15" stroke="#b91c1c" strokeWidth="2.5" strokeLinecap="round" />
          <rect x="8" y="13" width="3" height="6" rx="1.5" fill="#b91c1c" />
          <rect x="25" y="13" width="3" height="6" rx="1.5" fill="#b91c1c" />
          {/* Collar/Shirt */}
          <path d="M10 32C10 25 14 23 18 23C22 23 26 25 26 32" fill="#121214" />
        </svg>
      </div>
    );
  }

  // Partner avatar: anime girl with ponytail
  return (
    <div className="w-8 h-8 rounded-full bg-[#2a2a32] border border-neutral-700 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
      <svg viewBox="0 0 36 36" fill="none" className="w-full h-full">
        <rect width="36" height="36" fill="#2d2d38" />
        {/* Ponytail */}
        <circle cx="27" cy="12" r="5" fill="#18181b" />
        <circle cx="18" cy="16" r="7" fill="#fbe0cb" />
        {/* Hair bangs */}
        <path d="M11 16C11 11 14 9 18 9C22 9 25 11 25 16C24 17 22 17 18 17C14 17 12 17 11 16Z" fill="#18181b" />
        <path d="M12 13C14 14 17 14.5 19 14C21 13.5 23 12 24 12" stroke="#18181b" strokeWidth="2" strokeLinecap="round" />
        {/* Hair tie */}
        <circle cx="24" cy="13" r="1.5" fill="#b91c1c" />
        {/* Collar */}
        <path d="M10 32C10 26 14 24 18 24C22 24 26 26 26 32" fill="#18181b" />
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

  const formattedTime =
    typeof payload.timestamp === 'number'
      ? new Date(payload.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      : payload.timestamp
      ? new Date(payload.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      : 'Just now';

  // 1. Polymorphic Handler: Chat Messages
  if (payload.kind === 'chat_message') {
    // System Notice (Centered capsule pill)
    if (payload.isSystem) {
      return (
        <div className={`w-full flex justify-center my-2.5 px-2 ${className}`} style={style}>
          <div className="border border-[#e2ddd5] bg-white/75 backdrop-blur-xs rounded-full px-5 py-2 flex items-center justify-between w-full max-w-2xl shadow-xs text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-5 h-5 rounded-full border border-red-300 flex items-center justify-center text-red-600 bg-red-50 text-[10px] flex-shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <span className="text-[#b91c1c] font-black tracking-wide text-xs">System</span>
              <span className="text-neutral-800 font-medium truncate">{payload.content}</span>
            </div>
            <span className="text-neutral-400 text-xs tabular-nums flex-shrink-0 ml-3">
              {formattedTime}
            </span>
          </div>
        </div>
      );
    }

    const isSelf = payload.sender.role === 'self';

    if (isSelf) {
      // Right-aligned User Message (Crimson Bubble)
      return (
        <div className={`flex flex-col items-end my-2 group px-2 ${className}`} style={style}>
          <div className="flex items-center gap-2 mb-1 mr-1">
            <span className="text-neutral-400 text-[11px] tabular-nums">{formattedTime}</span>
            <span className="font-bold text-xs text-neutral-800">{payload.sender.username}</span>
            <span className="bg-[#b91c1c] text-white text-[9px] font-black px-1.5 py-0.5 rounded-sm tracking-wider">
              YOU
            </span>
            <UserAvatar username={payload.sender.username} isSelf={true} />
          </div>

          <div className="relative max-w-md sm:max-w-lg">
            <div className="bg-[#b91c1c] text-white rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-sm text-sm font-medium leading-relaxed break-words">
              {payload.content}
              {payload.attachmentNode && (
                <div className="mt-2 pt-2 border-t border-white/20">
                  {payload.attachmentNode}
                </div>
              )}
            </div>

            {payload.canDelete && payload.onDelete && (
              <button
                onClick={payload.onDelete}
                className="opacity-0 group-hover:opacity-100 absolute -left-7 top-2 text-neutral-400 hover:text-red-600 p-1 transition-opacity text-xs"
                title="Delete message"
                aria-label="Delete message"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            )}
          </div>
        </div>
      );
    }

    // Left-aligned Partner/Stranger Message (Dark Charcoal Bubble)
    return (
      <div className={`flex flex-col items-start my-2 group px-2 ${className}`} style={style}>
        <div className="flex items-center gap-2 mb-1 ml-1">
          <UserAvatar username={payload.sender.username} isSelf={false} />
          <span className="font-bold text-xs text-neutral-800">{payload.sender.username}</span>
          <span className="text-neutral-400 text-[11px] tabular-nums">{formattedTime}</span>
        </div>

        <div className="relative max-w-md sm:max-w-lg">
          <div className="bg-[#1e1e24] text-white rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm text-sm font-medium leading-relaxed break-words">
            {payload.content}
            {payload.attachmentNode && (
              <div className="mt-2 pt-2 border-t border-neutral-700">
                {payload.attachmentNode}
              </div>
            )}
          </div>

          {payload.canDelete && payload.onDelete && (
            <button
              onClick={payload.onDelete}
              className="opacity-0 group-hover:opacity-100 absolute -right-7 top-2 text-neutral-400 hover:text-red-500 p-1 transition-opacity text-xs"
              title="Delete message"
              aria-label="Delete message"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }

  // 2. Polymorphic Handler: Status Alert
  if (payload.kind === 'status_alert') {
    const severityBorder =
      payload.severity === 'error' ? 'border-[#b91c1c] bg-red-50 text-red-900' :
      payload.severity === 'warning' ? 'border-amber-500 bg-amber-50 text-amber-900' :
      payload.severity === 'success' ? 'border-emerald-500 bg-emerald-50 text-emerald-900' :
      'border-neutral-400 bg-neutral-50 text-neutral-900';

    return (
      <div
        role="alert"
        className={`rounded-2xl border-l-4 p-4 shadow-sm relative ${severityBorder} ${className}`}
        style={style}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold text-xs uppercase tracking-wider">{payload.title}</span>
          <span className="text-[11px] opacity-60 tabular-nums">{formattedTime}</span>
        </div>
        <p className="text-xs mt-1 font-medium leading-relaxed">{payload.description}</p>
        {payload.dismissible && payload.onDismiss && (
          <button
            onClick={payload.onDismiss}
            className="absolute top-3 right-3 text-xs opacity-60 hover:opacity-100 p-1"
            aria-label="Dismiss alert"
          >
            ✕
          </button>
        )}
      </div>
    );
  }

  // 3. Polymorphic Handler: Stranger Event
  if (payload.kind === 'stranger_event') {
    return (
      <div
        role="status"
        className={`rounded-2xl bg-white border border-[#e2ddd5] p-4 shadow-sm ${className}`}
        style={style}
      >
        <div className="flex items-center justify-between gap-2 border-b border-neutral-100 pb-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="bg-[#b91c1c] text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
              Stranger Event
            </span>
            <span className="font-bold text-xs text-neutral-800">
              Stranger #{payload.targetUser.publicId}
            </span>
          </div>
          <span className="text-[11px] text-neutral-400 tabular-nums">{formattedTime}</span>
        </div>
        <p className="text-xs text-neutral-700 font-medium leading-relaxed">{payload.summary}</p>
        {payload.actions && payload.actions.length > 0 && (
          <div className="mt-3 pt-2 border-t border-neutral-100 flex gap-2 justify-end">
            {payload.actions.map((act) => (
              <button
                key={act.id}
                onClick={() => (act.onClick ? act.onClick(payload) : onActionClick?.(act.id, payload))}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-colors ${
                  act.variant === 'danger'
                    ? 'bg-[#b91c1c] hover:bg-red-700 text-white'
                    : 'bg-[#18181b] hover:bg-neutral-800 text-white'
                }`}
              >
                {act.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 4. Polymorphic Handler: System Log
  return (
    <div
      role="log"
      className={`rounded-xl bg-[#18181b] text-[#22c55e] p-3 font-mono text-xs border border-neutral-800 ${className}`}
      style={style}
    >
      <div className="flex items-center justify-between text-neutral-400 text-[10px] mb-1">
        <span>[{payload.origin}] • {payload.level}</span>
        <span className="tabular-nums">{formattedTime}</span>
      </div>
      <p className="text-neutral-200">{payload.message}</p>
      {payload.payloadTrace && (
        <pre className="mt-2 p-2 bg-black/60 rounded text-[#a3e635] text-[10px] overflow-x-auto">
          {JSON.stringify(payload.payloadTrace, null, 2)}
        </pre>
      )}
    </div>
  );
});
