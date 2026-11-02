'use client';

import React from 'react';

export interface WallpaperOption {
  id: string;
  name: string;
  filename: string;
  previewUrl: string;
}

export const WALLPAPER_LIST: WallpaperOption[] = [
  {
    id: 'crimson-wanderer',
    name: 'Crimson Sumi-e Sunset Wanderer',
    filename: '/image.png',
    previewUrl: '/image.png',
  },
  {
    id: 'headphones-red-moon',
    name: 'Headphones Beneath the Red Moon',
    filename: '/wallpapers/headphones-beneath-the-red-moon.png',
    previewUrl: '/wallpapers/headphones-beneath-the-red-moon.png',
  },
  {
    id: 'crimson-mist-torii',
    name: 'Crimson Mist Torii Landscape',
    filename: '/wallpapers/crimson-mist-torii-landscape.png',
    previewUrl: '/wallpapers/crimson-mist-torii-landscape.png',
  },
  {
    id: 'anime-sunset',
    name: 'Anime Sunset Serenity with Torii',
    filename: '/wallpapers/anime-sunset.png',
    previewUrl: '/wallpapers/anime-sunset.png',
  },
  {
    id: 'cherry-blossom',
    name: 'Moonlit Cherry Blossom Mountain',
    filename: '/wallpapers/cherry-blossom.png',
    previewUrl: '/wallpapers/cherry-blossom.png',
  },
  {
    id: 'samurai-moon',
    name: 'Samurai Under the Violet Moon',
    filename: '/wallpapers/samurai-moon.png',
    previewUrl: '/wallpapers/samurai-moon.png',
  },
  {
    id: 'starlit-valley',
    name: 'Starlit Valley Beneath Golden Tree',
    filename: '/wallpapers/starlit-valley.png',
    previewUrl: '/wallpapers/starlit-valley.png',
  },
  {
    id: 'aurora-valley',
    name: 'Aurora Over the Snowy Valley',
    filename: '/wallpapers/aurora-valley.png',
    previewUrl: '/wallpapers/aurora-valley.png',
  },
];

interface WallpaperModalProps {
  isOpen: boolean;
  activeWallpaper: string;
  onSelect: (url: string) => void;
  onClose: () => void;
}

export default function WallpaperModal({
  isOpen,
  activeWallpaper,
  onSelect,
  onClose,
}: WallpaperModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#FFF9F2] text-[#211D1B] border border-[#D8C9BC] rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 px-6 border-b border-[#D8C9BC] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🖼️</span>
            <div>
              <h3 className="font-bold text-base tracking-tight text-[#211D1B]">
                Wallpaper Library
              </h3>
              <p className="text-xs text-[#81766F]">
                Select an authentic aesthetic artwork to feature as your workspace background.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#E8DED3] hover:bg-[#D8C9BC] flex items-center justify-center text-sm font-bold text-[#211D1B] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Wallpaper Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {WALLPAPER_LIST.map((wp) => {
            const isSelected = activeWallpaper === wp.filename;
            return (
              <div
                key={wp.id}
                onClick={() => {
                  onSelect(wp.filename);
                }}
                className={`group relative rounded-2xl overflow-hidden border-2 cursor-pointer transition-all hover:scale-102 hover:shadow-lg ${
                  isSelected ? 'border-[#C51F26] ring-2 ring-[#C51F26]/30' : 'border-[#D8C9BC] hover:border-neutral-400'
                }`}
              >
                <div
                  className="h-28 w-full bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                  style={{ backgroundImage: `url('${wp.filename}')` }}
                />
                <div className="p-2.5 bg-[#FFF9F2] flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#211D1B] truncate">{wp.name}</span>
                  {isSelected && (
                    <span className="w-4 h-4 rounded-full bg-[#C51F26] text-white flex items-center justify-center text-[9px] font-black flex-shrink-0">
                      ✓
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-[#D8C9BC] bg-[#FFF9F2] flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#C51F26] hover:bg-[#A8171D] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
