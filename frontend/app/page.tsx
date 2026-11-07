'use client';

import { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { useSocket } from '@/lib/useSocket';
import { roomAPI, messageAPI, uploadAPI, moderationAPI, userAPI } from '@/lib/api';
import type { FileAttachment } from '@/lib/types';
import VoiceChat from '@/components/VoiceChat';
import ConfirmDialog from '@/components/ConfirmDialog';
import MediaMessage from '@/components/MediaMessage';
import MatchingModal from '@/components/MatchingModal';
import ReportModal from '@/components/ReportModal';
import StrangerChatLanding from '@/components/StrangerChatLanding';
import LeftNavigation from '@/components/LeftNavigation';
import WallpaperModal from '@/components/WallpaperModal';
import { useTheme } from '@/lib/ThemeContext';
import TopHeader from '@/components/TopHeader';
import RightSidebar from '@/components/RightSidebar';
import { MasterFeedTile } from '@/components/MasterFeedTile';
import MobileAppleDock from '@/components/MobileAppleDock';
import MobileAppleSheet from '@/components/MobileAppleSheet';

export default function Home() {
  const router = useRouter();
  const {
    user,
    setUser,
    currentRoom,
    rooms,
    messages,
    isConnected,
    typingUsers,
    userRoleInCurrentRoom,
    matchedPartner,
    suggestions,
    setSuggestions,
    setCurrentRoom,
    setRooms,
    setMessages,
    setMatchedPartner,
    logout,
  } = useStore();

  const { sendMessage, startTyping, stopTyping, renameRoom, socket } = useSocket();

  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEditingRoomName, setIsEditingRoomName] = useState(false);
  const [roomNameInput, setRoomNameInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showMatchingModal, setShowMatchingModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showRoomsDrawer, setShowRoomsDrawer] = useState(false);
  const [activeNavTab, setActiveNavTab] = useState<'home' | 'stranger_chat' | 'rooms' | 'voice_rooms' | 'library'>('stranger_chat');
  const [showWallpaperModal, setShowWallpaperModal] = useState(false);
  const [mobileSheet, setMobileSheet] = useState<'voice' | 'suggestions' | 'rooms' | null>(null);
  const { theme, activeWallpaper, setThemeByWallpaper } = useTheme();

  // Voice Chat States
  const [isInVoice, setIsInVoice] = useState(false);
  const [connectingVoice, setConnectingVoice] = useState(false);
  const [joinTrigger, setJoinTrigger] = useState(false);
  const [leaveTrigger, setLeaveTrigger] = useState(false);

  // File Upload States
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; messageId: string | null }>({
    isOpen: false,
    messageId: null,
  });

  // Create Room state
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [createRoomError, setCreateRoomError] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialLoadDoneRef = useRef(false);

  // Block partner handler
  const handleBlockPartner = async () => {
    if (!matchedPartner) return;
    if (window.confirm(`Block #${matchedPartner.publicId}? You will never be matched with this user again.`)) {
      try {
        await moderationAPI.blockUser(matchedPartner.publicId);
        alert(`User #${matchedPartner.publicId} blocked successfully.`);
      } catch (err: unknown) {
        const errorObj = err as { response?: { data?: { error?: string } } };
        alert(errorObj.response?.data?.error || 'Failed to block user');
      }
    }
  };

  // Leave room handler
  const handleLeaveRoom = () => {
    if (currentRoom && socket?.connected) {
      socket.emit('leave_room', { roomId: currentRoom._id });
    }
    setCurrentRoom(null);
    setMatchedPartner(null);
    setSuggestions([]);
    setMessages([]);
  };

  useEffect(() => {
    if (matchedPartner) {
      setShowMatchingModal(false);
    }
  }, [matchedPartner]);

  // Select a room
  const selectRoom = useCallback(async (roomId: string) => {
    try {
      const room = rooms.find((r) => r._id === roomId);
      if (!room) return;

      setCurrentRoom(room);
      const data = await messageAPI.getByRoom(roomId);
      setMessages(data.messages || []);
      await roomAPI.join(roomId);
      setShowRoomsDrawer(false);
    } catch (error) {
      console.error('Failed to join room:', error);
    }
  }, [rooms, setCurrentRoom, setMessages]);

  // Check if current user is an active participant in this room
  const isParticipantInRoom = useMemo(() => {
    if (!currentRoom) return false;
    if (currentRoom.roomType === 'channel') return true;
    if (matchedPartner) return true;
    if (userRoleInCurrentRoom === 'participant') return true;
    if (
      user &&
      currentRoom.participants?.some(
        (p: any) =>
          p === user._id ||
          p?._id === user._id ||
          String(p) === String(user._id)
      )
    ) {
      return true;
    }
    return false;
  }, [currentRoom, matchedPartner, userRoleInCurrentRoom, user]);

  // Rename Room Handler (Both participants can rename)
  const handleStartEditRoomName = () => {
    if (!isParticipantInRoom) return;
    setRoomNameInput(currentRoom?.name || '');
    setIsEditingRoomName(true);
  };

  const handleSaveRoomName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRoom || !roomNameInput.trim()) return;
    renameRoom(currentRoom._id, roomNameInput.trim());
    setIsEditingRoomName(false);
  };

  // Auth redirect and user state restoration
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token) {
      window.location.replace('/login');
      return;
    }

    if (storedUser && !user) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed) {
          if (!parsed.token) parsed.token = token;
          setUser(parsed);
          return;
        }
      } catch (err) {
        console.error('Failed to restore user from localStorage:', err);
      }
    }

    if (!user) {
      userAPI.getMe().then((data: any) => {
        if (data?.user) {
          const fullUser = { ...data.user, token };
          localStorage.setItem('user', JSON.stringify(fullUser));
          setUser(fullUser);
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.replace('/login');
        }
      }).catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.replace('/login');
      });
    }
  }, [user, setUser]);

  // Initial rooms load
  useEffect(() => {
    if (!user || initialLoadDoneRef.current) return;
    initialLoadDoneRef.current = true;

    const loadRooms = async () => {
      try {
        const data = await roomAPI.getAll();
        setRooms(data.rooms || []);

        if (data.rooms && data.rooms.length > 0 && !currentRoom) {
          // If the user was already a participant in an active stranger chat, resume it
          const activeUserRoom = data.rooms.find(
            (r: any) =>
              r.roomType === 'stranger_chat' &&
              r.status === 'active' &&
              r.participants?.some(
                (p: any) =>
                  p === user._id ||
                  p?._id === user._id ||
                  String(p) === String(user._id)
              )
          );

          if (activeUserRoom) {
            setCurrentRoom(activeUserRoom);
            const messagesData = await messageAPI.getByRoom(activeUserRoom._id);
            setMessages(messagesData.messages || []);
            await roomAPI.join(activeUserRoom._id);
          }
          // If not an active participant in any stranger chat, leave currentRoom as null
          // so the user starts cleanly on StrangerChatLanding (MEET SOMEONE NEW)
        }
      } catch (error) {
        console.error('Failed to load rooms:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRooms();
  }, [currentRoom, setCurrentRoom, setMessages, setRooms, user]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Voice Chat Handlers
  const handleJoinVoice = () => {
    setConnectingVoice(true);
    setJoinTrigger((prev) => !prev);
  };

  const handleLeaveVoice = () => {
    setLeaveTrigger((prev) => !prev);
    setIsInVoice(false);
    setConnectingVoice(false);
  };

  // File Upload Handlers
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    if (file.size > MAX_FILE_SIZE) {
      setUploadError('File too large (max 100MB)');
      return;
    }

    const allowedPrefixes = ['image/', 'video/', 'audio/'];
    if (!allowedPrefixes.some((p) => file.type.startsWith(p))) {
      setUploadError('Only image, video, and audio files are allowed');
      return;
    }

    setPendingFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const cancelPendingFile = () => {
    setPendingFile(null);
    setUploadError(null);
    setUploadProgress(null);
  };

  // Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageText.trim() && !pendingFile) || sendingMessage) return;

    setSendingMessage(true);
    setUploadError(null);

    try {
      let attachment: FileAttachment | undefined;

      if (pendingFile) {
        setUploadProgress(0);
        const uploadData = await uploadAPI.requestUpload(
          pendingFile.name,
          pendingFile.type,
          pendingFile.size
        );

        await uploadAPI.uploadToS3(uploadData.fileId, uploadData.uploadUrl, pendingFile, setUploadProgress);

        attachment = {
          fileId: uploadData.fileId,
          fileName: pendingFile.name,
          mimeType: pendingFile.type,
          fileSize: pendingFile.size,
          s3Key: '',
        };

        setMediaUrls((prev) => ({ ...prev, [uploadData.fileId]: uploadData.downloadUrl }));
        setPendingFile(null);
        setUploadProgress(null);
      }

      sendMessage(messageText.trim(), attachment);
      setMessageText('');
      stopTyping();
    } catch (error: unknown) {
      console.error('Failed to send message:', error);
      const errMsg = error instanceof Error ? error.message : 'Upload failed';
      setUploadError(errMsg);
      setUploadProgress(null);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleTyping = (value: string) => {
    setMessageText(value);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (value.length > 0) {
      startTyping();
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, 2000);
    } else {
      stopTyping();
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    setDeleteConfirm({ isOpen: true, messageId });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.messageId) return;
    try {
      await messageAPI.delete(deleteConfirm.messageId);
      setMessages(messages.filter((m) => m._id !== deleteConfirm.messageId));
    } catch (error) {
      console.error('Failed to delete message:', error);
    } finally {
      setDeleteConfirm({ isOpen: false, messageId: null });
    }
  };

  const canDeleteMessage = (msgUsername: string) => {
    return user?.role === 'admin' || user?.username === msgUsername;
  };

  const handleCreateRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    setCreatingRoom(true);
    setCreateRoomError('');

    try {
      const data = await roomAPI.create(
        newRoomName.trim(),
        newRoomDescription.trim() || undefined,
        100
      );

      const createdRoom = (data as any).room || data;
      setRooms([...rooms, createdRoom]);
      setCurrentRoom(createdRoom);
      setShowCreateRoom(false);
      setShowRoomsDrawer(false);
      setNewRoomName('');
      setNewRoomDescription('');

      if (createdRoom._id) {
        await roomAPI.join(createdRoom._id);
        const messagesData = await messageAPI.getByRoom(createdRoom._id);
        setMessages(messagesData.messages || []);
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: string } } };
      setCreateRoomError(errorObj.response?.data?.error || 'Failed to create room');
    } finally {
      setCreatingRoom(false);
    }
  };

  const roomName = currentRoom?.name || 'Stranger Chat #7368 & #6202';
  const tagMatch = roomName.match(/#(\d+)\s*&\s*#(\d+)/);
  const roomTag = tagMatch
    ? `#${tagMatch[1]} & #${tagMatch[2]}`
    : (user?.publicId && matchedPartner?.publicId)
    ? `#${user.publicId} & #${matchedPartner.publicId}`
    : '#7368 & #6202';

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#141418] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-[#b91c1c] border-t-transparent animate-spin" />
          <span className="font-bold text-sm tracking-widest uppercase opacity-80">Connecting to Cordit...</span>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.replace('/login');
            }}
            className="text-xs text-[#f87171] hover:underline opacity-70 hover:opacity-100 transition-opacity"
          >
            Go to Login →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-screen w-screen min-w-[320px] overflow-hidden flex flex-col select-none relative transition-colors duration-300"
      style={{
        backgroundColor: theme.background,
        backgroundImage: `url('${activeWallpaper}')`,
        backgroundSize: 'auto 100%',
        backgroundPosition: 'left bottom',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* ── TOP HEADER (height: 64px, width: 100%) ── */}
      <TopHeader onOpenWallpapers={() => setShowWallpaperModal(true)} />

      {/* ── MAIN LAYOUT (below-header, height: calc(100vh - 64px), grid: 220px 1fr 300px, gap: 16px, p: 16px) ── */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-[72px_minmax(0,1fr)] lg:grid-cols-[220px_minmax(0,1fr)_300px] gap-0 sm:gap-4 p-0 sm:p-4 min-h-0 overflow-hidden relative z-10">
        {/* ── 1. LEFT NAVIGATION PANEL (Hidden on Mobile) ── */}
        <div className="hidden md:flex flex-col h-full">
          <LeftNavigation
            activeTab={currentRoom?.roomType === 'stranger_chat' ? 'stranger_chat' : activeNavTab}
            onSelectTab={(tab) => {
              if (tab === 'library') {
                setShowWallpaperModal(true);
              } else {
                setActiveNavTab(tab as any);
              }
            }}
            onOpenRooms={() => setShowRoomsDrawer(true)}
            onOpenMatch={() => setShowMatchingModal(true)}
            onOpenWallpapers={() => setShowWallpaperModal(true)}
          />
        </div>

        {/* ── 2. CENTER CHAT VIEWPORT ── */}
        {currentRoom ? (
          <div
            className="flex-1 rounded-none sm:rounded-[24px] border-0 sm:border shadow-[0_8px_24px_rgba(33,29,27,0.10)] flex flex-col min-h-0 min-w-0 overflow-hidden relative transition-colors duration-300 backdrop-blur-[10px]"
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.border,
            }}
          >
            {/* Chat Header (height: 64px, padding: 0 20px, borderBottom) */}
            <div
              className="h-14 sm:h-16 px-3.5 sm:px-5 border-b flex items-center justify-between select-none flex-shrink-0 transition-colors duration-300 backdrop-blur-xl"
              style={{
                backgroundColor: theme.surfaceSolid,
                borderColor: theme.border,
              }}
            >
              <div className="flex items-center gap-3 flex-wrap">
                {/* Title with Dynamic Underline and Inline Rename */}
                {isEditingRoomName ? (
                  <form onSubmit={handleSaveRoomName} className="flex items-center gap-1.5">
                    <span className="font-bold text-sm sm:text-base opacity-70">#</span>
                    <input
                      type="text"
                      value={roomNameInput}
                      onChange={(e) => setRoomNameInput(e.target.value)}
                      maxLength={45}
                      autoFocus
                      placeholder="Room name..."
                      className="px-2.5 py-1 rounded-xl text-xs sm:text-sm font-bold border outline-none max-w-[140px] sm:max-w-[220px]"
                      style={{
                        backgroundColor: `${theme.surfaceSolid}F2`,
                        borderColor: theme.border,
                        color: theme.text,
                      }}
                    />
                    <button
                      type="submit"
                      disabled={!roomNameInput.trim()}
                      className="px-2 py-1 rounded-lg text-xs font-bold shadow-xs transition-transform active:scale-95 disabled:opacity-40"
                      style={{
                        backgroundColor: theme.primary,
                        color: theme.outgoingText,
                      }}
                      title="Save room name"
                    >
                      ✓
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingRoomName(false)}
                      className="px-2 py-1 rounded-lg text-xs font-bold border hover:bg-white/10 transition-colors"
                      style={{
                        borderColor: theme.border,
                        color: theme.text,
                      }}
                      title="Cancel"
                    >
                      ✕
                    </button>
                  </form>
                ) : (
                  <div
                    className="flex flex-col group cursor-pointer"
                    onClick={handleStartEditRoomName}
                    title={!isParticipantInRoom ? 'Observers cannot rename' : 'Click to rename room'}
                  >
                    <h2 className="text-sm sm:text-lg font-bold tracking-tight flex items-center gap-1.5" style={{ color: theme.text }}>
                      <span>#</span>
                      <span className="truncate max-w-[130px] sm:max-w-[260px] hover:underline">
                        {currentRoom?.name || 'Stranger Chat'}
                      </span>
                      {isParticipantInRoom && (
                        <span
                          className="opacity-40 group-hover:opacity-100 transition-opacity text-xs"
                          title="Rename room"
                        >
                          ✎
                        </span>
                      )}
                    </h2>
                    <div className="h-[2.5px] w-full rounded-full mt-0.5" style={{ backgroundColor: theme.primary }} />
                  </div>
                )}

                {/* Partners Tag */}
                <div
                  className="border font-mono font-bold text-xs px-2.5 py-0.5 rounded-md shadow-2xs"
                  style={{
                    backgroundColor: theme.incomingBg,
                    borderColor: theme.border,
                    color: theme.text,
                  }}
                >
                  {roomTag}
                </div>

                {/* PUBLIC ROOM Badge */}
                <div
                  className="text-[9px] sm:text-[11px] font-bold px-2 sm:px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs hidden xs:flex"
                  style={{
                    backgroundColor: theme.primary,
                    color: theme.outgoingText,
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  <span>PUBLIC ROOM</span>
                </div>

                {/* Observer Count */}
                <div
                  className="border text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xs"
                  style={{
                    backgroundColor: theme.incomingBg,
                    borderColor: theme.border,
                    color: theme.text,
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: theme.textMuted }}>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <span>{currentRoom.observerCount ?? 4} Observers</span>
                </div>
              </div>

              {/* Chat Header Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowReportModal(true)}
                  className="font-bold text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:opacity-80 transition-colors"
                  style={{ color: theme.textMuted }}
                >
                  <span style={{ color: theme.primary }}>🚩</span>
                  <span className="hidden sm:inline">Report</span>
                </button>
                <button
                  onClick={handleLeaveRoom}
                  className="font-bold text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:opacity-80 transition-colors"
                  style={{ color: theme.textMuted }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span className="hidden sm:inline">Leave</span>
                </button>
              </div>
            </div>

            {/* Public Room Notice */}
            <div
              className="px-5 py-2 text-xs font-semibold flex items-center gap-2 border-b flex-shrink-0 transition-colors duration-300"
              style={{
                backgroundColor: theme.systemBg,
                color: theme.systemText,
                borderColor: theme.border,
              }}
            >
              <span className="text-sm">💡</span>
              <span>Public room — Observers can watch and drop suggestions. Keep conversations respectful.</span>
            </div>

            {/* Socket Disconnect Alert */}
            {!isConnected && (
              <div className="px-6 py-2">
                <MasterFeedTile
                  payload={{
                    id: 'net-disconnect-alert',
                    kind: 'status_alert',
                    severity: 'warning',
                    title: 'Gateway Disconnected',
                    description: 'Real-time gateway reconnecting in background...',
                    timestamp: 'Live',
                  }}
                />
              </div>
            )}

            {/* Scrollable Message Timeline (padding: 24px, gap: 18px, overflowY: auto) */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-3 sm:py-4 flex flex-col min-h-0">
              {/* Date Divider (Today) */}
              <div className="flex items-center justify-center my-2 relative px-8 flex-shrink-0">
                <div className="absolute inset-x-8 h-px" style={{ backgroundColor: theme.border }} />
                <span
                  className="relative rounded-full px-4 py-0.5 text-xs font-bold select-none shadow-2xs border"
                  style={{
                    backgroundColor: theme.surfaceSolid,
                    color: theme.textMuted,
                    borderColor: theme.border,
                  }}
                >
                  Today
                </span>
              </div>

              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center my-auto min-h-[200px]" style={{ color: theme.textMuted }}>
                  <span className="text-3xl mb-2 select-none">💬</span>
                  <h3 className="font-bold text-sm" style={{ color: theme.text }}>No messages yet</h3>
                  <p className="text-xs max-w-xs mt-1" style={{ color: theme.textMuted }}>
                    {userRoleInCurrentRoom === 'observer'
                      ? 'Waiting for participants to converse. Drop a suggestion from the right panel!'
                      : 'Say hello to start the conversation!'}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {messages.map((msg) => (
                    <MasterFeedTile
                      key={msg._id}
                      payload={{
                        id: msg._id,
                        kind: 'chat_message',
                        timestamp: msg.createdAt,
                        sender: {
                          username: msg.username,
                          publicId: msg.publicId,
                          role: msg.username === user?.username ? 'self' : 'participant',
                        },
                        content: msg.text,
                        isSystem: msg.messageType === 'system',
                        canDelete: canDeleteMessage(msg.username),
                        onDelete: () => handleDeleteMessage(msg._id),
                        attachment: msg.attachment,
                        attachmentNode: msg.attachment ? (
                          <MediaMessage
                            attachment={msg.attachment}
                            cachedUrl={mediaUrls[msg.attachment.fileId]}
                            onUrlLoaded={(fileId, url) =>
                              setMediaUrls((prev) => ({ ...prev, [fileId]: url }))
                            }
                          />
                        ) : undefined,
                      }}
                    />
                  ))}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div className="px-6 py-1 text-xs font-semibold italic" style={{ color: theme.primary }}>
                {typingUsers.join(', ')} is typing...
              </div>
            )}

            {/* File upload status */}
            {pendingFile && (
              <div
                className="mx-6 mb-2 p-2 rounded-xl flex items-center justify-between text-xs font-semibold border"
                style={{
                  backgroundColor: theme.surfaceMuted,
                  color: theme.text,
                  borderColor: theme.border,
                }}
              >
                <span className="truncate">{pendingFile.name}</span>
                <button onClick={cancelPendingFile} className="font-bold ml-2" style={{ color: theme.primary }}>
                  ✕
                </button>
              </div>
            )}

            {/* Mobile Apple Dock: Quick Actions strip */}
            <MobileAppleDock
              onOpenVoice={() => setMobileSheet('voice')}
              onOpenSuggestions={() => setMobileSheet('suggestions')}
              onOpenRooms={() => setMobileSheet('rooms')}
              onOpenMatch={() => setShowMatchingModal(true)}
              isInVoice={isInVoice}
              suggestionsCount={suggestions.length > 0 ? suggestions.length : 3}
            />

            {/* Composer (Apple iMessage style) */}
            <form
              onSubmit={handleSendMessage}
              className="p-2 sm:p-[16px_20px] flex items-center gap-2 sm:gap-3 border-t flex-shrink-0 transition-colors duration-300 backdrop-blur-xl"
              style={{
                backgroundColor: theme.surfaceSolid,
                borderColor: theme.border,
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,audio/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={!isParticipantInRoom}
              />

              <div
                className="flex-1 h-[42px] sm:h-[48px] border rounded-full sm:rounded-2xl px-3 sm:px-4 flex items-center gap-2 sm:gap-3 shadow-2xs transition-colors backdrop-blur-md"
                style={{
                  backgroundColor: theme.incomingBg,
                  borderColor: theme.border,
                }}
              >
                {/* Paperclip Attachment */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!isParticipantInRoom}
                  className="transition-colors disabled:opacity-40"
                  style={{ color: theme.textMuted }}
                  title="Attach file"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 9.88l-8.49 8.48a2 2 0 0 1-2.83-2.83l7.78-7.77" />
                  </svg>
                </button>

                {/* Emoji Icon */}
                <button
                  type="button"
                  className="transition-colors"
                  style={{ color: theme.textMuted }}
                  title="Insert emoji"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                    <line x1="9" y1="9" x2="9.01" y2="9" />
                    <line x1="15" y1="9" x2="15.01" y2="9" />
                  </svg>
                </button>

                {/* Text Input */}
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => handleTyping(e.target.value)}
                  placeholder={
                    !isParticipantInRoom
                      ? 'You are an observer (read-only mode)'
                      : 'Type your message...'
                  }
                  disabled={!isParticipantInRoom}
                  className="flex-1 bg-transparent text-sm focus:outline-none font-medium disabled:opacity-60"
                  style={{ color: theme.incomingText }}
                  maxLength={2000}
                />
              </div>

              {/* Dynamic Theme Send Button (48px) */}
              <button
                type="submit"
                disabled={
                  sendingMessage ||
                  (!messageText.trim() && !pendingFile) ||
                  !isParticipantInRoom
                }
                className="w-[42px] sm:w-[48px] h-[42px] sm:h-[48px] active:scale-95 rounded-full sm:rounded-2xl flex items-center justify-center transition-all shadow-md disabled:cursor-not-allowed disabled:opacity-30 flex-shrink-0 hover:scale-102"
                style={{
                  backgroundColor: theme.primary,
                  color: theme.outgoingText,
                }}
                title="Send message"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="translate-x-0.5"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" fill="currentColor" stroke="none" />
                </svg>
              </button>
            </form>
          </div>
        ) : (
          <div
            className="flex-1 overflow-y-auto rounded-none sm:rounded-[24px] border-0 sm:border backdrop-blur-md flex flex-col items-center justify-center p-2 sm:p-6"
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.border,
            }}
          >
            <StrangerChatLanding onOpenSidebar={() => setShowRoomsDrawer(true)} />
          </div>
        )}

        {/* ── 3. RIGHT SIDEBAR ── */}
        {currentRoom && (
          <div className="hidden lg:flex flex-col h-full min-h-0">
            <RightSidebar
              onJoinVoice={handleJoinVoice}
              onLeaveVoice={handleLeaveVoice}
              isInVoice={isInVoice}
              connectingVoice={connectingVoice}
            />
          </div>
        )}
      </main>

      {/* ── APPLE MOBILE BOTTOM SHEET (Voice, Suggestions, Rooms) ── */}
      <MobileAppleSheet
        isOpen={mobileSheet !== null}
        activeSheet={mobileSheet}
        onClose={() => setMobileSheet(null)}
        isInVoice={isInVoice}
        connectingVoice={connectingVoice}
        onJoinVoice={handleJoinVoice}
        onLeaveVoice={handleLeaveVoice}
        rooms={rooms}
        currentRoomId={currentRoom?._id}
        onSelectRoom={selectRoom}
      />

      {/* ── WALLPAPER & THEME GALLERY MODAL ── */}
      <WallpaperModal
        isOpen={showWallpaperModal}
        onClose={() => setShowWallpaperModal(false)}
      />

      {/* Hidden LiveKit Voice Processor */}
      <div className="hidden">
        <VoiceChat
          onJoinStateChange={(joined) => {
            setIsInVoice(joined);
            setConnectingVoice(false);
          }}
          externalJoinTrigger={joinTrigger}
          externalLeaveTrigger={leaveTrigger}
        />
      </div>

      {/* ── ROOMS DRAWER / MODAL ── */}
      {showRoomsDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-[#18181b] text-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-neutral-800">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-800">
              <h3 className="text-lg font-bold">Channels & Stranger Rooms</h3>
              <button
                onClick={() => setShowRoomsDrawer(false)}
                className="text-neutral-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
              {rooms.map((r) => (
                <button
                  key={r._id}
                  onClick={() => selectRoom(r._id)}
                  className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-all ${
                    currentRoom?._id === r._id
                      ? 'bg-[#b91c1c] text-white font-bold'
                      : 'bg-[#222228] text-neutral-300 hover:bg-[#2c2c34] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-400">#</span>
                    <span className="text-sm font-semibold truncate">{r.name}</span>
                  </div>
                  {r.roomType === 'stranger_chat' && (
                    <span className="text-[10px] bg-red-950 text-red-300 border border-red-700/50 px-2 py-0.5 rounded-full font-bold">
                      STRANGER
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-neutral-800 flex justify-between items-center">
              <button
                onClick={() => {
                  setShowCreateRoom(true);
                  setShowRoomsDrawer(false);
                }}
                className="text-xs font-bold text-[#f87171] hover:underline"
              >
                + Create Channel
              </button>
              <button
                onClick={() => setShowRoomsDrawer(false)}
                className="bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold px-4 py-2 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE ROOM MODAL ── */}
      {showCreateRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-[#18181b] text-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-neutral-800">
            <h3 className="text-lg font-bold mb-4">Create Channel</h3>
            {createRoomError && (
              <div className="bg-red-900/50 text-red-300 p-2 rounded-lg text-xs mb-3 font-semibold">
                {createRoomError}
              </div>
            )}
            <form onSubmit={handleCreateRoomSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1">Room Name</label>
                <input
                  type="text"
                  required
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="e.g. gaming, lounge"
                  className="w-full bg-[#232328] border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#b91c1c]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={newRoomDescription}
                  onChange={(e) => setNewRoomDescription(e.target.value)}
                  placeholder="Channel topic"
                  className="w-full bg-[#232328] border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#b91c1c]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateRoom(false)}
                  className="px-4 py-2 text-xs font-bold text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingRoom}
                  className="bg-[#b91c1c] hover:bg-red-700 text-white px-5 py-2 rounded-xl text-xs font-bold"
                >
                  {creatingRoom ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MATCHING & MODERATION MODALS ── */}
      <MatchingModal isOpen={showMatchingModal} onClose={() => setShowMatchingModal(false)} />
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetPublicId={matchedPartner?.publicId}
        roomId={currentRoom?._id}
      />
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onCancel={() => setDeleteConfirm({ isOpen: false, messageId: null })}
        onConfirm={confirmDelete}
        title="Delete Message"
        message="Are you sure you want to delete this message? This cannot be undone."
      />
    </div>
  );
}
