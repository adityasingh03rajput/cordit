export interface User {
  username: string;
  publicId?: number;
  gender?: 'male' | 'female' | 'other';
  genderPreference?: 'male' | 'female' | 'any';
  status?: 'active' | 'suspended' | 'banned';
  role: 'admin' | 'user';
  token: string;
}

export interface UserListItem {
  _id: string;
  username: string;
  publicId?: number;
  gender?: string;
  role: 'admin' | 'user';
  status?: 'active' | 'suspended' | 'banned';
  createdAt?: string;
}

export interface ReportItem {
  _id: string;
  reporterId?: { _id: string; username: string; publicId?: number };
  reportedUserId?: { _id: string; username: string; publicId?: number; status?: string };
  roomId?: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  actionTaken?: string;
  createdAt: string;
}

export interface Room {
  _id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  roomType?: 'channel' | 'stranger_chat';
  status?: 'active' | 'ended';
  isPublic?: boolean;
  maxUsers?: number;
  activeUserCount?: number;
  observerCount?: number;
  role?: 'participant' | 'observer';
  livekitRoomName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Suggestion {
  _id: string;
  roomId: string;
  observerId: string;
  observerPublicId: number;
  observerUsername: string;
  content: string;
  visibleTo?: string[];
  createdAt: string;
}

export interface FileAttachment {
  fileId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  s3Key: string;
}

export interface Message {
  _id: string;
  roomId: string;
  userId: string;
  username: string;
  publicId?: number;
  text: string;
  messageType: 'text' | 'system' | 'media';
  attachment?: FileAttachment;
  createdAt: string;
  updatedAt: string;
}

export interface InviteCode {
  code: string;
  createdBy: string;
  createdByUsername: string;
  expiresAt: string;
  isUsed: boolean;
  usedByUsername?: string;
  maxUses: number;
  currentUses: number;
  isExpired: boolean;
  isAvailable: boolean;
  remainingUses: number;
  createdAt: string;
}

export interface ActiveUser {
  userId: string;
  username: string;
  publicId?: number;
  role?: 'participant' | 'observer';
  joinedAt: string;
  isVoiceActive?: boolean;
  livekitParticipantId?: string;
}
