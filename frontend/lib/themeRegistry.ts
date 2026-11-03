export interface ThemeConfig {
  id: string;
  name: string;
  wallpaperUrl: string;
  isDark: boolean;
  background: string;
  surface: string;
  surfaceSolid: string;
  surfaceMuted: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryHover: string;
  accent: string;
  border: string;
  sidebar: string;
  sidebarText: string;
  systemBg: string;
  systemText: string;
  incomingBg: string;
  incomingText: string;
  incomingBorder: string;
  outgoingBg: string;
  outgoingText: string;
  wavePrimary: string;
  waveSecondary: string;
}

export const THEME_REGISTRY: Record<string, ThemeConfig> = {
  'crimson-wanderer': {
    id: 'crimson-wanderer',
    name: 'Crimson Sumi-e Sunset Wanderer',
    wallpaperUrl: '/image.png',
    isDark: false,
    background: '#F4EEE7',
    surface: 'rgba(255, 255, 255, 0.12)',
    surfaceSolid: 'rgba(255, 255, 255, 0.22)',
    surfaceMuted: 'rgba(255, 255, 255, 0.35)',
    text: '#211D1B',
    textMuted: '#5C544F',
    primary: '#C51F26',
    primaryHover: '#A8171D',
    accent: '#E6B7A2',
    border: 'rgba(216, 201, 188, 0.45)',
    sidebar: 'rgba(23, 22, 22, 0.85)',
    sidebarText: '#F7F1EB',
    systemBg: 'rgba(255, 255, 255, 0.35)',
    systemText: '#5C3825',
    incomingBg: 'rgba(255, 255, 255, 0.82)',
    incomingText: '#211D1B',
    incomingBorder: 'rgba(229, 218, 208, 0.65)',
    outgoingBg: '#C51F26',
    outgoingText: '#FFFFFF',
    wavePrimary: '#C51F26',
    waveSecondary: '#211D1B',
  },
  'headphones-red-moon': {
    id: 'headphones-red-moon',
    name: 'Headphones Beneath the Red Moon',
    wallpaperUrl: '/wallpapers/headphones-beneath-the-red-moon.png',
    isDark: true,
    background: '#0D0E12',
    surface: 'rgba(20, 21, 28, 0.35)',
    surfaceSolid: 'rgba(20, 21, 28, 0.48)',
    surfaceMuted: 'rgba(34, 36, 48, 0.6)',
    text: '#F3F4F6',
    textMuted: '#9CA3AF',
    primary: '#E11D48',
    primaryHover: '#BE123C',
    accent: '#FDA4AF',
    border: 'rgba(255, 255, 255, 0.12)',
    sidebar: 'rgba(14, 15, 20, 0.85)',
    sidebarText: '#F9FAFB',
    systemBg: 'rgba(225, 29, 72, 0.18)',
    systemText: '#FDA4AF',
    incomingBg: 'rgba(31, 33, 42, 0.72)',
    incomingText: '#F3F4F6',
    incomingBorder: 'rgba(255, 255, 255, 0.14)',
    outgoingBg: '#E11D48',
    outgoingText: '#FFFFFF',
    wavePrimary: '#E11D48',
    waveSecondary: '#FFFFFF',
  },
  'crimson-mist-torii': {
    id: 'crimson-mist-torii',
    name: 'Crimson Mist Torii Landscape',
    wallpaperUrl: '/wallpapers/crimson-mist-torii-landscape.png',
    isDark: false,
    background: '#EBE7E0',
    surface: 'rgba(255, 255, 255, 0.14)',
    surfaceSolid: 'rgba(255, 255, 255, 0.24)',
    surfaceMuted: 'rgba(255, 255, 255, 0.35)',
    text: '#1C1917',
    textMuted: '#57534E',
    primary: '#DC2626',
    primaryHover: '#B91C1C',
    accent: '#FCA5A5',
    border: 'rgba(255, 255, 255, 0.35)',
    sidebar: 'rgba(25, 23, 22, 0.85)',
    sidebarText: '#F5F5F4',
    systemBg: 'rgba(255, 255, 255, 0.35)',
    systemText: '#7F1D1D',
    incomingBg: 'rgba(255, 255, 255, 0.82)',
    incomingText: '#1C1917',
    incomingBorder: 'rgba(224, 216, 203, 0.65)',
    outgoingBg: '#DC2626',
    outgoingText: '#FFFFFF',
    wavePrimary: '#DC2626',
    waveSecondary: '#44403C',
  },
  'anime-sunset': {
    id: 'anime-sunset',
    name: 'Anime Sunset Serenity with Torii',
    wallpaperUrl: '/wallpapers/anime-sunset.png',
    isDark: false,
    background: '#FBF4EC',
    surface: 'rgba(255, 255, 255, 0.12)',
    surfaceSolid: 'rgba(255, 255, 255, 0.22)',
    surfaceMuted: 'rgba(255, 255, 255, 0.35)',
    text: '#291D17',
    textMuted: '#5C4436',
    primary: '#EA580C',
    primaryHover: '#C2410C',
    accent: '#FDBA74',
    border: 'rgba(255, 255, 255, 0.35)',
    sidebar: 'rgba(28, 22, 19, 0.85)',
    sidebarText: '#FFF7ED',
    systemBg: 'rgba(255, 255, 255, 0.35)',
    systemText: '#7C2D12',
    incomingBg: 'rgba(255, 255, 255, 0.82)',
    incomingText: '#291D17',
    incomingBorder: 'rgba(240, 223, 207, 0.65)',
    outgoingBg: '#EA580C',
    outgoingText: '#FFFFFF',
    wavePrimary: '#EA580C',
    waveSecondary: '#291D17',
  },
  'cherry-blossom': {
    id: 'cherry-blossom',
    name: 'Moonlit Cherry Blossom Mountain',
    wallpaperUrl: '/wallpapers/cherry-blossom.png',
    isDark: true,
    background: '#13101C',
    surface: 'rgba(27, 21, 38, 0.35)',
    surfaceSolid: 'rgba(27, 21, 38, 0.48)',
    surfaceMuted: 'rgba(47, 36, 68, 0.6)',
    text: '#FDF2F8',
    textMuted: '#BDB0CF',
    primary: '#D946EF',
    primaryHover: '#C026D3',
    accent: '#F0ABFC',
    border: 'rgba(255, 255, 255, 0.14)',
    sidebar: 'rgba(16, 12, 25, 0.85)',
    sidebarText: '#FDF2F8',
    systemBg: 'rgba(217, 70, 239, 0.18)',
    systemText: '#F5D0FE',
    incomingBg: 'rgba(37, 30, 54, 0.72)',
    incomingText: '#FDF2F8',
    incomingBorder: 'rgba(255, 255, 255, 0.14)',
    outgoingBg: '#D946EF',
    outgoingText: '#FFFFFF',
    wavePrimary: '#D946EF',
    waveSecondary: '#FFFFFF',
  },
  'samurai-moon': {
    id: 'samurai-moon',
    name: 'Samurai Under the Violet Moon',
    wallpaperUrl: '/wallpapers/samurai-moon.png',
    isDark: true,
    background: '#0E0B1A',
    surface: 'rgba(22, 17, 39, 0.35)',
    surfaceSolid: 'rgba(22, 17, 39, 0.48)',
    surfaceMuted: 'rgba(41, 32, 74, 0.6)',
    text: '#F5F3FF',
    textMuted: '#A79DC7',
    primary: '#8B5CF6',
    primaryHover: '#7C3AED',
    accent: '#C4B5FD',
    border: 'rgba(255, 255, 255, 0.14)',
    sidebar: 'rgba(11, 8, 20, 0.85)',
    sidebarText: '#F5F3FF',
    systemBg: 'rgba(139, 92, 246, 0.18)',
    systemText: '#DDD6FE',
    incomingBg: 'rgba(32, 25, 59, 0.72)',
    incomingText: '#F5F3FF',
    incomingBorder: 'rgba(255, 255, 255, 0.14)',
    outgoingBg: '#8B5CF6',
    outgoingText: '#FFFFFF',
    wavePrimary: '#8B5CF6',
    waveSecondary: '#FFFFFF',
  },
  'starlit-valley': {
    id: 'starlit-valley',
    name: 'Starlit Valley Beneath Golden Tree',
    wallpaperUrl: '/wallpapers/starlit-valley.png',
    isDark: true,
    background: '#081017',
    surface: 'rgba(14, 25, 36, 0.35)',
    surfaceSolid: 'rgba(14, 25, 36, 0.48)',
    surfaceMuted: 'rgba(28, 50, 71, 0.6)',
    text: '#F0FDF4',
    textMuted: '#86A2B8',
    primary: '#EAB308',
    primaryHover: '#CA8A04',
    accent: '#FEF08A',
    border: 'rgba(255, 255, 255, 0.14)',
    sidebar: 'rgba(6, 12, 18, 0.85)',
    sidebarText: '#F0FDF4',
    systemBg: 'rgba(234, 179, 8, 0.18)',
    systemText: '#FEF08A',
    incomingBg: 'rgba(20, 36, 52, 0.72)',
    incomingText: '#F0FDF4',
    incomingBorder: 'rgba(255, 255, 255, 0.14)',
    outgoingBg: '#EAB308',
    outgoingText: '#081017',
    wavePrimary: '#EAB308',
    waveSecondary: '#38BDF8',
  },
  'aurora-valley': {
    id: 'aurora-valley',
    name: 'Aurora Over the Snowy Valley',
    wallpaperUrl: '/wallpapers/aurora-valley.png',
    isDark: true,
    background: '#07131B',
    surface: 'rgba(13, 29, 39, 0.35)',
    surfaceSolid: 'rgba(13, 29, 39, 0.48)',
    surfaceMuted: 'rgba(25, 61, 82, 0.6)',
    text: '#F0FDFA',
    textMuted: '#7EA8BE',
    primary: '#06B6D4',
    primaryHover: '#0891B2',
    accent: '#67E8F9',
    border: 'rgba(255, 255, 255, 0.14)',
    sidebar: 'rgba(5, 14, 20, 0.85)',
    sidebarText: '#F0FDFA',
    systemBg: 'rgba(6, 182, 212, 0.18)',
    systemText: '#67E8F9',
    incomingBg: 'rgba(18, 42, 58, 0.72)',
    incomingText: '#F0FDFA',
    incomingBorder: 'rgba(255, 255, 255, 0.14)',
    outgoingBg: '#06B6D4',
    outgoingText: '#07131B',
    wavePrimary: '#06B6D4',
    waveSecondary: '#A5F3FC',
  },
};

export const DEFAULT_THEME_ID = 'crimson-wanderer';

export function getThemeByWallpaper(urlOrId: string): ThemeConfig {
  if (THEME_REGISTRY[urlOrId]) {
    return THEME_REGISTRY[urlOrId];
  }
  for (const theme of Object.values(THEME_REGISTRY)) {
    if (theme.wallpaperUrl === urlOrId) {
      return theme;
    }
  }
  return THEME_REGISTRY[DEFAULT_THEME_ID];
}
