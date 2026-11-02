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
    containerClasses: 'rounded-2xl',
    headerAccentClasses: 'text-neutral-800',
    typographyClasses: 'font-sans text-sm font-medium leading-relaxed',
    defaultBadge: (item) => {
      if (item.kind !== 'chat_message') return null;
      if (item.isSystem) {
        return { label: 'SYSTEM', bg: 'bg-[#b91c1c]', text: 'text-white' };
      }
      if (item.sender.role === 'observer') {
        return { label: 'OBSERVER', bg: 'bg-[#2a2a30]', text: 'text-neutral-300' };
      }
      if (item.sender.role === 'self') {
        return { label: 'YOU', bg: 'bg-[#b91c1c]', text: 'text-white' };
      }
      if (item.sender.publicId) {
        return { label: `#${item.sender.publicId}`, bg: 'bg-neutral-200', text: 'text-neutral-700' };
      }
      return null;
    },
  },

  status_alert: {
    ariaRole: 'alert',
    containerClasses: 'rounded-2xl border-l-4 bg-white',
    headerAccentClasses: 'text-neutral-900 font-bold',
    typographyClasses: 'font-sans text-xs font-medium text-neutral-800',
    defaultBadge: (item) => {
      if (item.kind !== 'status_alert') return null;
      const severityMap = {
        info: { bg: 'bg-neutral-800', text: 'text-white' },
        warning: { bg: 'bg-amber-500', text: 'text-white' },
        error: { bg: 'bg-[#b91c1c]', text: 'text-white' },
        success: { bg: 'bg-emerald-600', text: 'text-white' },
      };
      return { label: item.severity.toUpperCase(), ...severityMap[item.severity] };
    },
  },

  stranger_event: {
    ariaRole: 'status',
    containerClasses: 'rounded-2xl bg-white border border-[#e2ddd5]',
    headerAccentClasses: 'text-neutral-900 font-bold tracking-tight',
    typographyClasses: 'font-sans text-xs font-medium text-neutral-800',
    defaultBadge: (item) => {
      if (item.kind !== 'stranger_event') return null;
      return { label: 'PUBLIC EVENT', bg: 'bg-[#b91c1c]', text: 'text-white' };
    },
  },

  system_log: {
    ariaRole: 'log',
    containerClasses: 'bg-[#18181b] text-[#22c55e] border border-neutral-800 font-mono rounded-xl',
    headerAccentClasses: 'text-neutral-400',
    typographyClasses: 'font-mono text-xs leading-5 break-all text-neutral-200',
    defaultBadge: (item) => {
      if (item.kind !== 'system_log') return null;
      return { label: item.level, bg: 'bg-neutral-800', text: 'text-emerald-400' };
    },
  },
};
