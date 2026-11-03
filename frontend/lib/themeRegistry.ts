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
    surface: 'rgba(255, 249, 242, 0.92)',
    surfaceSolid: '#FFF9F2',
    surfaceMuted: '#E8DED3',
    text: '#211D1B',
    textMuted: '#81766F',
    primary: '#C51F26',
    primaryHover: '#A8171D',
    accent: '#E6B7A2',
    border: '#D8C9BC',
    sidebar: '#171616',
    sidebarText: '#F7F1EB',
    systemBg: '#F3E3C7',
    systemText: '#5C3825',
    incomingBg: '#FFFFFF',
    incomingText: '#211D1B',
    incomingBorder: '#E5DAD0',
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
    surface: 'rgba(20, 21, 28, 0.88)',
    surfaceSolid: '#15161E',
    surfaceMuted: '#222430',
    text: '#F3F4F6',
    textMuted: '#9CA3AF',
    primary: '#E11D48',
    primaryHover: '#BE123C',
    accent: '#FDA4AF',
    border: '#2E3242',
    sidebar: '#0E0F14',
    sidebarText: '#F9FAFB',
    systemBg: '#2A1620',
    systemText: '#FDA4AF',
    incomingBg: '#1F212A',
    incomingText: '#F3F4F6',
    incomingBorder: '#373B4D',
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
    surface: 'rgba(252, 250, 246, 0.92)',
    surfaceSolid: '#FAF8F5',
    surfaceMuted: '#DCD5C9',
    text: '#1C1917',
    textMuted: '#78716C',
    primary: '#DC2626',
    primaryHover: '#B91C1C',
    accent: '#FCA5A5',
    border: '#D3CCC0',
    sidebar: '#191716',
    sidebarText: '#F5F5F4',
    systemBg: '#FEE2E2',
    systemText: '#7F1D1D',
    incomingBg: '#FFFFFF',
    incomingText: '#1C1917',
    incomingBorder: '#E0D8CB',
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
    surface: 'rgba(255, 250, 245, 0.92)',
    surfaceSolid: '#FFFBF7',
    surfaceMuted: '#EDE1D2',
    text: '#291D17',
    textMuted: '#8A7467',
    primary: '#EA580C',
    primaryHover: '#C2410C',
    accent: '#FDBA74',
    border: '#E8D5C2',
    sidebar: '#1C1613',
    sidebarText: '#FFF7ED',
    systemBg: '#FFEDD5',
    systemText: '#7C2D12',
    incomingBg: '#FFFFFF',
    incomingText: '#291D17',
    incomingBorder: '#F0DFCF',
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
    surface: 'rgba(27, 21, 38, 0.88)',
    surfaceSolid: '#1C1628',
    surfaceMuted: '#2F2444',
    text: '#FDF2F8',
    textMuted: '#BDB0CF',
    primary: '#D946EF',
    primaryHover: '#C026D3',
    accent: '#F0ABFC',
    border: '#3E2E59',
    sidebar: '#100C19',
    sidebarText: '#FDF2F8',
    systemBg: '#3B1B47',
    systemText: '#F5D0FE',
    incomingBg: '#251E36',
    incomingText: '#FDF2F8',
    incomingBorder: '#473466',
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
    surface: 'rgba(22, 17, 39, 0.88)',
    surfaceSolid: '#17122A',
    surfaceMuted: '#29204A',
    text: '#F5F3FF',
    textMuted: '#A79DC7',
    primary: '#8B5CF6',
    primaryHover: '#7C3AED',
    accent: '#C4B5FD',
    border: '#36295C',
    sidebar: '#0B0814',
    sidebarText: '#F5F3FF',
    systemBg: '#281B4E',
    systemText: '#DDD6FE',
    incomingBg: '#20193B',
    incomingText: '#F5F3FF',
    incomingBorder: '#41326E',
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
    surface: 'rgba(14, 25, 36, 0.88)',
    surfaceSolid: '#0F1C28',
    surfaceMuted: '#1C3247',
    text: '#F0FDF4',
    textMuted: '#86A2B8',
    primary: '#EAB308',
    primaryHover: '#CA8A04',
    accent: '#FEF08A',
    border: '#1E3A52',
    sidebar: '#060C12',
    sidebarText: '#F0FDF4',
    systemBg: '#262914',
    systemText: '#FEF08A',
    incomingBg: '#142434',
    incomingText: '#F0FDF4',
    incomingBorder: '#234562',
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
    surface: 'rgba(13, 29, 39, 0.88)',
    surfaceSolid: '#0E222E',
    surfaceMuted: '#193D52',
    text: '#F0FDFA',
    textMuted: '#7EA8BE',
    primary: '#06B6D4',
    primaryHover: '#0891B2',
    accent: '#67E8F9',
    border: '#1A4761',
    sidebar: '#050E14',
    sidebarText: '#F0FDFA',
    systemBg: '#0F3238',
    systemText: '#67E8F9',
    incomingBg: '#122A3A',
    incomingText: '#F0FDFA',
    incomingBorder: '#205777',
    outgoingBg: '#06B6D4',
    outgoingText: '#07131B',
    wavePrimary: '#06B6D4',
    waveSecondary: '#A5F3FC',
  },
};

export const DEFAULT_THEME_ID = 'crimson-wanderer';

// Find theme by wallpaper URL or theme id
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
