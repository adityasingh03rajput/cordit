'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { useSocket } from '@/lib/useSocket';
import { roomAPI, messageAPI, uploadAPI, moderationAPI } from '@/lib/api';
import type { FileAttachment } from '@/lib/types';
import VoiceChat from '@/components/VoiceChat';
import ConfirmDialog from '@/components/ConfirmDialog';
import MediaMessage from '@/components/MediaMessage';
import MatchingModal from '@/components/MatchingModal';
import ReportModal from '@/components/ReportModal';
import StrangerChatLanding from '@/components/StrangerChatLanding';
import LeftNavigation from '@/components/LeftNavigation';
import TopHeader from '@/components/TopHeader';
import RightSidebar from '@/components/RightSidebar';
import { MasterFeedTile } from '@/components/MasterFeedTile';

export default function Home() {
  const router = useRouter();
  const {
    user,
    currentRoom,
    rooms,
    messages,
    isConnected,
    typingUsers,
    userRoleInCurrentRoom,
    matchedPartner,
    setSuggestions,
    setCurrentRoom,
    setRooms,
    setMessages,
    setMatchedPartner,
    logout,
  } = useStore();

  const { sendMessage, startTyping, stopTyping, socket } = useSocket();

  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showMatchingModal, setShowMatchingModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showRoomsDrawer, setShowRoomsDrawer] = useState(false);
  const [activeNavTab, setActiveNavTab] = useState<'home' | 'stranger_chat' | 'rooms' | 'voice_rooms' | 'library'>('stranger_chat');

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

  // Auth redirect check
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  // Initial rooms load
  useEffect(() => {
    if (!user || initialLoadDoneRef.current) return;
    initialLoadDoneRef.current = true;

    const loadRooms = async () => {
      try {
        const data = await roomAPI.getAll();
        setRooms(data.rooms || []);

        if (data.rooms && data.rooms.length > 0 && !currentRoom) {
          // Prefer stranger chat room if available
          const strangerRoom = data.rooms.find((r: any) => r.roomType === 'stranger_chat') || data.rooms[0];
          setCurrentRoom(strangerRoom);
          const messagesData = await messageAPI.getByRoom(strangerRoom._id);
          setMessages(messagesData.messages || []);
          await roomAPI.join(strangerRoom._id);
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

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f0e8] text-neutral-800">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-[#b91c1c] border-t-transparent animate-spin" />
          <span className="font-bold text-sm tracking-widest uppercase">Connecting to Cordit...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-screen w-screen overflow-hidden flex bg-[#f4f0e8] text-neutral-900 select-none"
      style={{
        backgroundImage: `radial-gradient(circle at 10% 20%, rgba(0,0,0,0.015) 0%, transparent 60%), radial-gradient(circle at 90% 80%, rgba(0,0,0,0.02) 0%, transparent 60%)`,
      }}
    >
      {/* ── 1. LEFT NAVIGATION PANEL ── */}
      <LeftNavigation
        activeTab={activeNavTab}
        onSelectTab={(tab) => setActiveNavTab(tab as any)}
        onOpenRooms={() => setShowRoomsDrawer(true)}
        onOpenMatch={() => setShowMatchingModal(true)}
      />

      {/* ── 2. CENTER & HEADER COLUMN ── */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        {/* Top Header */}
        <TopHeader
          onReport={() => setShowReportModal(true)}
          onLeave={handleLeaveRoom}
          onBlock={handleBlockPartner}
          onToggleRooms={() => setShowRoomsDrawer(true)}
        />

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

        {/* Central Chat Viewport or Landing */}
        {currentRoom ? (
          <div className="flex-1 flex flex-col min-h-0 px-6 pb-5 pt-2">
            {/* Soft Warm Parchment Chat Card */}
            <div className="flex-1 bg-[#faf8f5] rounded-3xl border border-[#e8e4dc] shadow-sm flex flex-col min-h-0 overflow-hidden relative">
              {/* Date Divider (Today) */}
              <div className="flex items-center justify-center my-3.5 relative px-8 flex-shrink-0">
                <div className="absolute inset-x-8 h-px bg-[#e8e4dc]" />
                <span className="relative bg-[#faf8f5] px-4 text-xs font-semibold text-neutral-400 select-none">
                  Today
                </span>
              </div>

              {/* Scrollable Message Timeline */}
              <div className="flex-1 overflow-y-auto px-6 py-2 flex flex-col min-h-0">
                {messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center my-auto min-h-[200px] text-neutral-400">
                    <span className="text-3xl mb-2 select-none">💬</span>
                    <h3 className="font-bold text-sm text-neutral-700">No messages yet</h3>
                    <p className="text-xs text-neutral-400 max-w-xs mt-1">
                      {userRoleInCurrentRoom === 'observer'
                        ? 'Waiting for participants to converse. Drop a suggestion from the right panel!'
                        : 'Say hello to start the conversation!'}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    {messages.map((msg, idx) => (
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
                <div className="px-6 py-1 text-xs text-[#b91c1c] font-semibold italic">
                  {typingUsers.join(', ')} is typing...
                </div>
              )}

              {/* File upload status */}
              {pendingFile && (
                <div className="mx-6 mb-2 p-2 bg-neutral-100 rounded-xl flex items-center justify-between text-xs font-semibold">
                  <span className="truncate">{pendingFile.name}</span>
                  <button onClick={cancelPendingFile} className="text-red-600 font-bold ml-2">
                    ✕
                  </button>
                </div>
              )}

              {/* Docked Floating Message Composer */}
              <form
                onSubmit={handleSendMessage}
                className="p-4 pt-2 flex items-center gap-3 bg-[#faf8f5] border-t border-[#f0ece4] flex-shrink-0"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*,audio/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={userRoleInCurrentRoom === 'observer'}
                />

                <div className="flex-1 bg-white/80 border border-[#e2ddd5] rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-xs">
                  {/* Paperclip Attachment */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={userRoleInCurrentRoom === 'observer'}
                    className="text-neutral-400 hover:text-neutral-800 transition-colors disabled:opacity-40"
                    title="Attach file"
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
                    >
                      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 9.88l-8.49 8.48a2 2 0 0 1-2.83-2.83l7.78-7.77" />
                    </svg>
                  </button>

                  {/* Emoji Icon */}
                  <button
                    type="button"
                    className="text-neutral-400 hover:text-neutral-800 transition-colors"
                    title="Insert emoji"
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
                    >
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
                      userRoleInCurrentRoom === 'observer'
                        ? 'You are an observer (read-only mode)'
                        : 'Type your message...'
                    }
                    disabled={userRoleInCurrentRoom === 'observer'}
                    className="flex-1 bg-transparent text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none font-medium disabled:opacity-60"
                    maxLength={2000}
                  />
                </div>

                {/* Crimson Send Button */}
                <button
                  type="submit"
                  disabled={
                    sendingMessage ||
                    (!messageText.trim() && !pendingFile) ||
                    userRoleInCurrentRoom === 'observer'
                  }
                  className="bg-[#b91c1c] hover:bg-[#a11818] text-white p-3 rounded-2xl flex items-center justify-center transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
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
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <StrangerChatLanding onOpenSidebar={() => setShowRoomsDrawer(true)} />
          </div>
        )}
      </div>

      {/* ── 3. RIGHT SIDEBAR (VOICE CHAT & SUGGESTIONS) ── */}
      {currentRoom && (
        <RightSidebar
          onJoinVoice={handleJoinVoice}
          onLeaveVoice={handleLeaveVoice}
          isInVoice={isInVoice}
          connectingVoice={connectingVoice}
        />
      )}

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
