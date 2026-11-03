'use client';

import React from 'react';
import { useTheme } from '@/lib/ThemeContext';
import { THEME_REGISTRY } from '@/lib/themeRegistry';

export interface WallpaperOption {
  id: string;
  name: string;
  filename: string;
  previewUrl: string;
}

export const WALLPAPER_LIST: WallpaperOption[] = Object.values(THEME_REGISTRY).map((t) => ({
  id: t.id,
  name: t.name,
  filename: t.wallpaperUrl,
  previewUrl: t.wallpaperUrl,
}));

interface WallpaperModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WallpaperModal({
  isOpen,
  onClose,
}: WallpaperModalProps) {
  const { theme, activeWallpaper, setThemeByWallpaper } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] border transition-colors duration-300"
        style={{
          backgroundColor: theme.surfaceSolid,
          color: theme.text,
          borderColor: theme.border,
        }}
      >
        {/* Header */}
        <div
          className="p-5 px-6 border-b flex items-center justify-between"
          style={{ borderColor: theme.border }}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🖼️</span>
            <div>
              <h3 className="font-bold text-base tracking-tight" style={{ color: theme.text }}>
                Wallpaper & Theme Library
              </h3>
              <p className="text-xs" style={{ color: theme.textMuted }}>
                Select an aesthetic artwork — UI elements, badges, bubbles, and waveforms automatically adapt to match its palette!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all hover:scale-105"
            style={{
              backgroundColor: theme.surfaceMuted,
              color: theme.text,
            }}
          >
            ✕
          </button>
        </div>

        {/* Wallpaper & Theme Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.values(THEME_REGISTRY).map((t) => {
            const isSelected = activeWallpaper === t.wallpaperUrl;
            return (
              <div
                key={t.id}
                onClick={() => {
                  setThemeByWallpaper(t.id);
                }}
                className={`group relative rounded-2xl overflow-hidden border-2 cursor-pointer transition-all hover:scale-102 hover:shadow-lg ${isSelected ? 'ring-2' : 'hover:opacity-90'
                  }`}
                style={{
                  borderColor: isSelected ? t.primary : theme.border,
                  boxShadow: isSelected ? `0 0 16px ${t.primary}40` : undefined,
                }}
              >
                {/* Artwork Thumbnail */}
                <div
                  className="h-28 w-full bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                  style={{ backgroundImage: `url('${t.wallpaperUrl}')` }}
                />

                {/* Theme Palette Bar & Title */}
                <div
                  className="p-3 flex flex-col gap-1.5 transition-colors"
                  style={{
                    backgroundColor: t.surfaceSolid,
                    color: t.text,
                    borderTop: `1px solid ${t.border}`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold truncate pr-1" style={{ color: t.text }}>
                      {t.name}
                    </span>
                    {isSelected && (
                      <span
                        className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0"
                        style={{ backgroundColor: t.primary, color: t.outgoingText }}
                      >
                        ✓
                      </span>
                    )}
                  </div>

                  {/* Palette Dots */}
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <span
                      className="w-3 h-3 rounded-full border border-black/10 shadow-2xs"
                      style={{ backgroundColor: t.primary }}
                      title="Primary Accent"
                    />
                    <span
                      className="w-3 h-3 rounded-full border border-black/10 shadow-2xs"
                      style={{ backgroundColor: t.background }}
                      title="Background"
                    />
                    <span
                      className="w-3 h-3 rounded-full border border-black/10 shadow-2xs"
                      style={{ backgroundColor: t.outgoingBg }}
                      title="Bubble Accent"
                    />
                    <span
                      className="w-3 h-3 rounded-full border border-black/10 shadow-2xs"
                      style={{ backgroundColor: t.systemBg }}
                      title="System Badge"
                    />
                    <span className="text-[9px] font-semibold opacity-70 ml-auto">
                      {t.isDark ? 'Dark' : 'Light'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          className="p-4 px-6 border-t flex justify-between items-center"
          style={{
            borderColor: theme.border,
            backgroundColor: theme.surfaceSolid,
          }}
        >
          <div className="flex items-center gap-2 text-xs" style={{ color: theme.textMuted }}>
            <span>Active:</span>
            <span className="font-bold" style={{ color: theme.primary }}>
              {theme.name}
            </span>
          </div>

          <button
            onClick={onClose}
            className="text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition-all hover:scale-102"
            style={{
              backgroundColor: theme.primary,
              color: theme.outgoingText,
            }}
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
}
