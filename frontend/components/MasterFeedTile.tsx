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

export const MasterFeedTile = memo(function MasterFeedTile({
  payload,
  onActionClick,
  className = '',
  style,
}: MasterFeedTileProps) {
  const strategy = ADAPTATION_MATRIX[payload.kind];
  const badge = strategy.defaultBadge(payload);

  // Extracted headers & content based on discriminated union
  const primaryTitle =
    payload.kind === 'chat_message' ? payload.sender.username :
    payload.kind === 'status_alert' ? payload.title :
    payload.kind === 'stranger_event' ? `Stranger #${payload.targetUser.publicId}` :
    `[${payload.origin}]`;

  const bodyContent =
    payload.kind === 'chat_message' ? payload.content :
    payload.kind === 'status_alert' ? payload.description :
    payload.kind === 'stranger_event' ? payload.summary :
    payload.message;

  const resolvedBg = payload.kind === 'chat_message' && payload.bgColor
    ? payload.bgColor
    : undefined;

  return (
    <div
      role={strategy.ariaRole}
      data-kind={payload.kind}
      className={`card-brutal border-[3px] p-4 transition-all relative ${strategy.containerClasses} ${className}`}
      style={{
        ...(resolvedBg ? { background: resolvedBg } : {}),
        ...style,
      }}
    >
      {/* ── Top Meta Bar ── */}
      <header className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-black/10">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm font-black truncate max-w-[240px] ${strategy.headerAccentClasses}`}>
            {primaryTitle}
          </span>
          {badge && (
            <span className={`badge-brutal text-[10px] px-1.5 py-0 font-black tracking-wider ${badge.bg} ${badge.text}`}>
              {badge.label}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Contextual Delete Action for Chat Messages */}
          {payload.kind === 'chat_message' && payload.canDelete && payload.onDelete && (
            <button
              onClick={payload.onDelete}
              className="badge-brutal cursor-pointer hover:bg-error transition-colors"
              style={{
                width: '28px',
                height: '28px',
                background: 'var(--bg-secondary)',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Delete message"
              aria-label="Delete message"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </button>
          )}

          <time className="badge-brutal text-xs bg-card tabular-nums">
            {typeof payload.timestamp === 'number'
              ? new Date(payload.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : payload.timestamp}
          </time>
        </div>
      </header>

      {/* ── Adaptive Body Text ── */}
      {bodyContent && (
        <div className={strategy.typographyClasses}>
          {bodyContent}
        </div>
      )}

      {/* ── Polymorphic Attachment / Media Viewer Slot ── */}
      {payload.kind === 'chat_message' && payload.attachmentNode && (
        <div className="mt-2">
          {payload.attachmentNode}
        </div>
      )}

      {/* ── Polymorphic System Log JSON Viewer ── */}
      {payload.kind === 'system_log' && payload.payloadTrace && (
        <pre className="mt-2 p-2 bg-black/90 text-[#a3e635] text-[11px] font-mono overflow-x-auto rounded-none border border-black/40">
          {JSON.stringify(payload.payloadTrace, null, 2)}
        </pre>
      )}

      {/* ── Action Bar / Interactive Footer ── */}
      {payload.kind === 'stranger_event' && payload.actions && payload.actions.length > 0 && (
        <footer className="mt-3 pt-2 border-t border-black/20 flex gap-2 justify-end">
          {payload.actions.map((act) => (
            <button
              key={act.id}
              onClick={() => (act.onClick ? act.onClick(payload) : onActionClick?.(act.id, payload))}
              className={`btn-brutal text-xs font-black px-3 py-1 uppercase ${
                act.variant === 'danger' ? 'bg-error text-white' : 'bg-black text-yellow'
              }`}
            >
              {act.label}
            </button>
          ))}
        </footer>
      )}

      {/* ── Dismiss Button for Status Alerts ── */}
      {payload.kind === 'status_alert' && payload.dismissible && (
        <button
          onClick={payload.onDismiss}
          className="absolute top-2 right-2 text-xs font-black p-1 hover:opacity-70 leading-none"
          aria-label="Dismiss alert"
        >
          ✕
        </button>
      )}
    </div>
  );
});
