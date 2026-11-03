'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeConfig, THEME_REGISTRY, DEFAULT_THEME_ID, getThemeByWallpaper } from './themeRegistry';

interface ThemeContextType {
  theme: ThemeConfig;
  activeWallpaper: string;
  setThemeByWallpaper: (wallpaperUrlOrId: string) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: THEME_REGISTRY[DEFAULT_THEME_ID],
  activeWallpaper: THEME_REGISTRY[DEFAULT_THEME_ID].wallpaperUrl,
  setThemeByWallpaper: () => { },
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeConfig>(THEME_REGISTRY[DEFAULT_THEME_ID]);
  const [activeWallpaper, setActiveWallpaper] = useState<string>(THEME_REGISTRY[DEFAULT_THEME_ID].wallpaperUrl);

  // Apply CSS custom variables to document root
  const applyThemeToDOM = (t: ThemeConfig) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.style.setProperty('--cordit-bg', t.background);
    root.style.setProperty('--cordit-surface', t.surface);
    root.style.setProperty('--cordit-surface-solid', t.surfaceSolid);
    root.style.setProperty('--cordit-surface-muted', t.surfaceMuted);
    root.style.setProperty('--cordit-text', t.text);
    root.style.setProperty('--cordit-text-muted', t.textMuted);
    root.style.setProperty('--cordit-primary', t.primary);
    root.style.setProperty('--cordit-primary-hover', t.primaryHover);
    root.style.setProperty('--cordit-accent', t.accent);
    root.style.setProperty('--cordit-border', t.border);
    root.style.setProperty('--cordit-sidebar', t.sidebar);
    root.style.setProperty('--cordit-sidebar-text', t.sidebarText);
    root.style.setProperty('--cordit-system-bg', t.systemBg);
    root.style.setProperty('--cordit-system-text', t.systemText);
    root.style.setProperty('--cordit-incoming-bg', t.incomingBg);
    root.style.setProperty('--cordit-incoming-border', t.incomingBorder);
    root.style.setProperty('--cordit-incoming-text', t.incomingText);
    root.style.setProperty('--cordit-outgoing-bg', t.outgoingBg);
    root.style.setProperty('--cordit-outgoing-text', t.outgoingText);
  };

  useEffect(() => {
    const saved = localStorage.getItem('cordit_wallpaper') || localStorage.getItem('cordit_theme');
    if (saved) {
      const foundTheme = getThemeByWallpaper(saved);
      setTheme(foundTheme);
      setActiveWallpaper(foundTheme.wallpaperUrl);
      applyThemeToDOM(foundTheme);
    } else {
      applyThemeToDOM(THEME_REGISTRY[DEFAULT_THEME_ID]);
    }
  }, []);

  const setThemeByWallpaper = (wallpaperUrlOrId: string) => {
    const foundTheme = getThemeByWallpaper(wallpaperUrlOrId);
    setTheme(foundTheme);
    setActiveWallpaper(foundTheme.wallpaperUrl);
    localStorage.setItem('cordit_wallpaper', foundTheme.wallpaperUrl);
    localStorage.setItem('cordit_theme', foundTheme.id);
    applyThemeToDOM(foundTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, activeWallpaper, setThemeByWallpaper }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

