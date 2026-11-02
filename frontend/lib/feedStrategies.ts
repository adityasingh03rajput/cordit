import type { PolymorphicFeedPayload } from './feedTypes';

export interface TileStyleStrategy {
  ariaRole: 'article' | 'alert' | 'status' | 'log';
  containerClasses: string;
  headerAccentClasses: string;
  typographyClasses: string;
  defaultBadge: (item: PolymorphicFeedPayload) => { label: string; bg: string; text: string } | null;
}

export const ADAPTATION_MATRIX: Record<PolymorphicFeedPayload['kind'], TileStyleStrategy> = {
  chat_message: {
    ariaRole: 'article',
    containerClasses: 'border-black hover:border-black/80',
    headerAccentClasses: 'text-dark',
    typographyClasses: 'font-sans text-sm font-semibold text-dark leading-relaxed',
    defaultBadge: (item) => {
      if (item.kind !== 'chat_message') return null;
      if (item.isSystem) {
        return { label: 'SYSTEM', bg: 'bg-black', text: 'text-yellow' };
      }
      if (item.sender.role === 'observer') {
        return { label: 'SPECTATOR', bg: 'bg-purple', text: 'text-white' };
      }
      if (item.sender.role === 'self') {
        return { label: 'YOU', bg: 'bg-yellow', text: 'text-dark' };
      }
      if (item.sender.publicId) {
        return { label: `#${item.sender.publicId}`, bg: 'bg-surface', text: 'text-dim' };
      }
      return null;
    },
  },

  status_alert: {
    ariaRole: 'alert',
    containerClasses: 'bg-surface border-black',
    headerAccentClasses: 'text-dark font-black',
    typographyClasses: 'font-sans text-xs font-bold text-dark/90',
    defaultBadge: (item) => {
      if (item.kind !== 'status_alert') return null;
      const severityMap = {
        info: { bg: 'bg-cyan', text: 'text-black' },
        warning: { bg: 'bg-warning', text: 'text-black' },
        error: { bg: 'bg-error', text: 'text-white' },
        success: { bg: 'bg-success', text: 'text-white' },
      };
      return { label: item.severity.toUpperCase(), ...severityMap[item.severity] };
    },
  },

  stranger_event: {
    ariaRole: 'status',
    containerClasses: 'gradient-yellow border-black',
    headerAccentClasses: 'text-dark font-black uppercase tracking-tight',
    typographyClasses: 'font-sans text-sm font-bold text-dark',
    defaultBadge: (item) => {
      if (item.kind !== 'stranger_event') return null;
      return { label: 'PUBLIC EVENT', bg: 'bg-black', text: 'text-yellow' };
    },
  },

  system_log: {
    ariaRole: 'log',
    containerClasses: 'bg-[#18181b] text-[#22c55e] border-black font-mono',
    headerAccentClasses: 'text-[#a1a1aa]',
    typographyClasses: 'font-mono text-xs leading-5 break-all text-[#e4e4e7]',
    defaultBadge: (item) => {
      if (item.kind !== 'system_log') return null;
      return { label: item.level, bg: 'bg-[#27272a]', text: 'text-[#a3e635]' };
    },
  },
};
