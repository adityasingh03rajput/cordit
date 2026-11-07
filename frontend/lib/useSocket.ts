'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useStore } from './store';
import type { Message, FileAttachment, Suggestion } from './types';

const getSocketUrl = () => {
  if (typeof window !== 'undefined') {
    if (process.env.NEXT_PUBLIC_BACKEND_URL && !process.env.NEXT_PUBLIC_BACKEND_URL.includes('localhost')) {
      return process.env.NEXT_PUBLIC_BACKEND_URL;
    }
    const host = window.location.hostname;
    if (host.includes('trycloudflare.com') || host.includes('cloudflare')) {
      return 'https://elephant-payroll-adding-requiring.trycloudflare.com';
    }
    if (host.includes('lhr.life') || host.includes('localhost.run')) {
      return 'https://758d1643db99b8.lhr.life';
    }
    if (host.includes('pinggy')) {
      return 'https://qunch-2405-201-3003-588c-8c31-88a3-fb98-9717.free.pinggy.net';
    }
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    return `${protocol}//${host}:3000`;
  }
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
};

let globalSocket: Socket | null = null;
let currentSocketToken: string | null = null;
let socketListenersAttached = false;

const getSocket = (token: string) => {
  const socketUrl = getSocketUrl();
  if (!globalSocket || !globalSocket.connected || currentSocketToken !== token) {
    if (globalSocket) {
      globalSocket.disconnect();
      globalSocket = null;
      socketListenersAttached = false;
    }
    currentSocketToken = token;
    globalSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });
  }
  return globalSocket;
};

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const {
    user,
    currentRoom,
    addMessage,
    setConnected,
    addTypingUser,
    removeTypingUser,
    setMatching,
    setMatchError,
    setMatchedPartner,
    setCurrentRoom,
    setRooms,
    setUserRoleInCurrentRoom,
    addSuggestion,
    updateSuggestionVisibility,
    updateCurrentRoomObserverCount,
    updateRoomName,
  } = useStore();

  useEffect(() => {
    const token = user?.token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
    if (!token) return;

    const socket = getSocket(token);
    socketRef.current = socket;

    if (!socketListenersAttached) {
      socketListenersAttached = true;

      socket.on('connect', () => {
        setConnected(true);
      });

      socket.on('connect_error', (err) => {
        console.warn('Socket connect_error:', err?.message || err);
        setConnected(false);
      });

      socket.on('disconnect', () => {
        setConnected(false);
        setMatching(false);
      });

      socket.on('new_message', (message: Message) => {
        addMessage(message);
      });

      socket.on('user_typing', (data: { username: string; isTyping: boolean }) => {
        if (data.isTyping) {
          addTypingUser(data.username);
          setTimeout(() => removeTypingUser(data.username), 3000);
        } else {
          removeTypingUser(data.username);
        }
      });

      socket.on('joined_room', (data: {
        roomId: string;
        roomName: string;
        roomType?: string;
        role?: 'participant' | 'observer';
        observerCount?: number;
      }) => {
        if (data.role) {
          setUserRoleInCurrentRoom(data.role);
        }
        if (typeof data.observerCount === 'number') {
          updateCurrentRoomObserverCount(data.observerCount);
        }
      });

      // Observer Suggestion received
      socket.on('chat:suggestion:new', (suggestion: Suggestion) => {
        addSuggestion(suggestion);
      });

      // Suggestion visibility updated
      socket.on('chat:suggestion:visibility_updated', (data: { suggestionId: string; visible: boolean }) => {
        updateSuggestionVisibility(data.suggestionId, data.visible);
      });

      // Global rooms updated
      socket.on('rooms_updated', async () => {
        try {
          const { roomAPI } = await import('./api');
          const data = await roomAPI.getAll();
          setRooms(data.rooms);
        } catch (e) {
          console.error('Failed to refresh rooms on update:', e);
        }
      });

      // Room renamed in real-time
      socket.on('room:renamed', (data: { roomId: string; name: string }) => {
        updateRoomName(data.roomId, data.name);
      });

      // Matching Socket Events
      socket.on('match:waiting', () => {
        setMatching(true);
        setMatchError(null);
      });

      socket.on('match:left_queue', () => {
        setMatching(false);
      });

      socket.on('match:error', (data: { message: string }) => {
        setMatching(false);
        setMatchError(data.message || 'Matching error occurred');
      });

      socket.on('match:found', (data: {
        roomId: string;
        roomName: string;
        partner: { publicId: number; username: string; gender: string };
        role: string;
      }) => {
        setMatching(false);
        setMatchError(null);
        setMatchedPartner(data.partner);
        setUserRoleInCurrentRoom('participant');

        setCurrentRoom({
          _id: data.roomId,
          name: data.roomName,
          roomType: 'stranger_chat',
          role: 'participant',
          isDefault: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      });

      socket.on('error', (error: { message: string }) => {
        console.error('Socket error:', error.message);
      });
    }

    return () => {};
  }, [user, addMessage, setConnected, addTypingUser, removeTypingUser, setMatching, setMatchError, setMatchedPartner, setCurrentRoom, setUserRoleInCurrentRoom, addSuggestion]);

  const currentRoomId = currentRoom?._id;
  useEffect(() => {
    if (currentRoomId && socketRef.current?.connected) {
      socketRef.current.emit('join_room', { roomId: currentRoomId });

      return () => {
        socketRef.current?.emit('leave_room', { roomId: currentRoomId });
      };
    }
  }, [currentRoomId]);

  const sendMessage = (text: string, attachment?: FileAttachment) => {
    if (socketRef.current && currentRoom) {
      socketRef.current.emit('send_message', { roomId: currentRoom._id, text, attachment });
    }
  };

  const startTyping = () => {
    if (socketRef.current && currentRoom) {
      socketRef.current.emit('typing_start', { roomId: currentRoom._id });
    }
  };

  const stopTyping = () => {
    if (socketRef.current && currentRoom) {
      socketRef.current.emit('typing_stop', { roomId: currentRoom._id });
    }
  };

  const joinMatchingQueue = (genderPreference?: 'male' | 'female' | 'any') => {
    if (socketRef.current) {
      setMatching(true);
      setMatchError(null);
      socketRef.current.emit('match:join_queue', { genderPreference });
    }
  };

  const leaveMatchingQueue = () => {
    if (socketRef.current) {
      socketRef.current.emit('match:leave_queue');
    }
  };

  const requestDirectMatch = (targetPublicId: number) => {
    if (socketRef.current) {
      setMatchError(null);
      socketRef.current.emit('match:direct_request', { targetPublicId });
    }
  };

  const sendSuggestion = (content: string) => {
    if (socketRef.current && currentRoom) {
      socketRef.current.emit('chat:suggestion:send', {
        roomId: currentRoom._id,
        content,
      });
    }
  };

  const toggleSuggestionVisibility = (suggestionId: string, visible: boolean) => {
    if (socketRef.current) {
      socketRef.current.emit('chat:suggestion:toggle_visibility', {
        suggestionId,
        visible,
      });
    }
  };

  const renameRoom = (roomId: string, name: string) => {
    const socket = socketRef.current || globalSocket;
    if (socket?.connected) {
      socket.emit('room:rename', { roomId, name });
    }
  };

  return {
    sendMessage,
    startTyping,
    stopTyping,
    joinMatchingQueue,
    leaveMatchingQueue,
    requestDirectMatch,
    sendSuggestion,
    toggleSuggestionVisibility,
    renameRoom,
    socket: globalSocket,
  };
};

export const disconnectSocket = () => {
  if (globalSocket) {
    globalSocket.disconnect();
    globalSocket = null;
    currentSocketToken = null;
    socketListenersAttached = false;
  }
};
