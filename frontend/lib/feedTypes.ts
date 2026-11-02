import type { FileAttachment } from './types';
import type React from 'react';

export type FeedItemKind = 
  | 'chat_message' 
  | 'status_alert' 
  | 'stranger_event' 
  | 'system_log';

export interface ActionDefinition {
  id: string;
  label: string;
  variant?: 'primary' | 'danger' | 'ghost';
  icon?: string;
  onClick?: (payload: PolymorphicFeedPayload) => void;
}

export interface BaseFeedPayload {
  id: string;
  timestamp: string | number;
  metadata?: Record<string, string | number>;
}

// 1. Participant / Stranger Chat Bubble
export interface ChatMessagePayload extends BaseFeedPayload {
  kind: 'chat_message';
  sender: {
    username: string;
    publicId?: number;
    role?: 'participant' | 'observer' | 'self';
  };
  content?: string;
  isSystem?: boolean;
  canDelete?: boolean;
  onDelete?: () => void;
  attachment?: FileAttachment;
  attachmentNode?: React.ReactNode;
  bgColor?: string;
  reactions?: Array<{ emoji: string; count: number }>;
}

// 2. Real-time Status / Network Alert
export interface StatusAlertPayload extends BaseFeedPayload {
  kind: 'status_alert';
  severity: 'info' | 'warning' | 'error' | 'success';
  title: string;
  description: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

// 3. Stranger Lifecycle Notification (Match found, Direct Request, Suggestion)
export interface StrangerEventPayload extends BaseFeedPayload {
  kind: 'stranger_event';
  eventType: 'match_found' | 'incoming_request' | 'observer_suggestion';
  targetUser: {
    username: string;
    publicId: number;
    gender?: 'male' | 'female' | 'other';
  };
  summary: string;
  actions?: ActionDefinition[];
}

// 4. System / Audit Event Log
export interface SystemLogPayload extends BaseFeedPayload {
  kind: 'system_log';
  level: 'TRACE' | 'DEBUG' | 'WARN' | 'CRIT';
  origin: string;
  message: string;
  payloadTrace?: Record<string, unknown>;
}

export type PolymorphicFeedPayload = 
  | ChatMessagePayload 
  | StatusAlertPayload 
  | StrangerEventPayload 
  | SystemLogPayload;
