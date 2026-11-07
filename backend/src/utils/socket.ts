import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import Room from '../models/room';
import Message from '../models/message';
import User from '../models/user';
import Suggestion from '../models/suggestion';
import { logger } from './logger';
import { config } from '../config';
import { matchingService } from '../services/matchingService';

// Cooldown tracker to prevent observer suggestion spam (max 1 suggestion per 30s per user)
const suggestionRateLimitMap = new Map<string, number>();
const SUGGESTION_COOLDOWN_MS = 30000;

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  userDocId?: string;
  username?: string;
  publicId?: number;
  gender?: 'male' | 'female' | 'other';
  genderPreference?: 'male' | 'female' | 'any';
}

interface JoinRoomData {
  roomId: string;
}

interface AttachmentData {
  fileId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  s3Key: string;
}

interface SendMessageData {
  roomId: string;
  text: string;
  attachment?: AttachmentData;
}

interface TypingData {
  roomId: string;
}

interface JoinQueueData {
  genderPreference?: 'male' | 'female' | 'any';
}

interface DirectMatchData {
  targetPublicId: number;
}

interface SendSuggestionData {
  roomId: string;
  content: string;
}

interface ToggleSuggestionData {
  suggestionId: string;
  visible: boolean;
}

export const initializeSocket = (httpServer: HTTPServer) => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: (requestOrigin, callback) => {
        if (!requestOrigin || process.env.ENVIRONMENT === 'development') {
          callback(null, true);
        } else if (config.allowedOrigins.includes(requestOrigin) || config.allowedOrigins.includes('*')) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, config.jwtSecret) as { username: string; role: string };

      const user = await User.findOne({ username: decoded.username, isDeleted: false });
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      if (user.status === 'banned') {
        return next(new Error('Authentication error: Account is banned'));
      }

      socket.userId = user.username;
      socket.userDocId = user._id.toString();
      socket.username = user.username;
      socket.publicId = user.publicId;
      socket.gender = user.gender;
      socket.genderPreference = user.genderPreference;

      next();
    } catch {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`User connected: #${socket.publicId} (${socket.username}) on ${socket.id}`);

    if (socket.userDocId && socket.publicId) {
      matchingService.registerSocket({
        socketId: socket.id,
        userId: socket.userDocId,
        username: socket.username || 'Anonymous',
        publicId: socket.publicId,
        gender: socket.gender || 'other',
        genderPreference: socket.genderPreference || 'any',
      });
    }

    // Join random stranger matching queue
    socket.on('match:join_queue', async (data?: JoinQueueData) => {
      try {
        if (!socket.userDocId || !socket.publicId) {
          socket.emit('match:error', { message: 'Authentication missing' });
          return;
        }

        const dbUser = await User.findById(socket.userDocId);
        const currentGender = dbUser?.gender || socket.gender || 'other';
        const pref = data?.genderPreference || dbUser?.genderPreference || socket.genderPreference || 'any';
        socket.gender = currentGender;
        socket.genderPreference = pref;

        const queueUser = {
          socketId: socket.id,
          userId: socket.userDocId,
          username: socket.username || 'Anonymous',
          publicId: socket.publicId,
          gender: currentGender,
          genderPreference: pref,
          queuedAt: Date.now(),
        };

        const result = matchingService.addToRandomQueue(queueUser);

        if (result.matched && result.userA && result.userB) {
          const { userA, userB } = result;

          // Create public stranger chat room
          const roomName = `Stranger Chat #${userA.publicId} & #${userB.publicId}`;
          const newRoom = new Room({
            name: roomName,
            description: `Public conversation between #${userA.publicId} and #${userB.publicId}`,
            roomType: 'stranger_chat',
            isDefault: false,
            isPublic: true,
            status: 'active',
            participants: [userA.userId, userB.userId],
            observers: [],
            activeUsers: [
              { userId: userA.userId, username: userA.username, publicId: userA.publicId, role: 'participant', joinedAt: new Date() },
              { userId: userB.userId, username: userB.username, publicId: userB.publicId, role: 'participant', joinedAt: new Date() },
            ],
          });

          await newRoom.save();

          const sockA = io.sockets.sockets.get(userA.socketId);
          const sockB = io.sockets.sockets.get(userB.socketId);

          if (sockA) sockA.join(newRoom._id.toString());
          if (sockB) sockB.join(newRoom._id.toString());

          // Notify User A
          io.to(userA.socketId).emit('match:found', {
            roomId: newRoom._id.toString(),
            roomName: newRoom.name,
            partner: {
              publicId: userB.publicId,
              username: userB.username,
              gender: userB.gender,
            },
            role: 'participant',
          });

          // Notify User B
          io.to(userB.socketId).emit('match:found', {
            roomId: newRoom._id.toString(),
            roomName: newRoom.name,
            partner: {
              publicId: userA.publicId,
              username: userA.username,
              gender: userA.gender,
            },
            role: 'participant',
          });

          io.emit('rooms_updated');
        } else {
          socket.emit('match:waiting', {
            queueLength: result.queueLength || 1,
            genderPreference: pref,
          });
        }
      } catch (error) {
        console.error('DETAILED ERROR IN match:join_queue:', error);
        logger.error('Error in match:join_queue:', error);
        socket.emit('match:error', { message: 'Failed to join matching queue' });
      }
    });

    // Leave random matching queue
    socket.on('match:leave_queue', () => {
      matchingService.removeFromQueue(socket.id);
      socket.emit('match:left_queue');
      logger.info(`User #${socket.publicId} left matching queue`);
    });

    // Direct ID search & match
    socket.on('match:direct_request', async (data: DirectMatchData) => {
      try {
        const targetId = Number(data?.targetPublicId);
        if (!targetId || isNaN(targetId)) {
          socket.emit('match:error', { message: 'Please provide a valid numeric public ID' });
          return;
        }

        if (targetId === socket.publicId) {
          socket.emit('match:error', { message: 'You cannot match with yourself' });
          return;
        }

        const targetDbUser = await User.findOne({ publicId: targetId, isDeleted: false });
        if (!targetDbUser) {
          socket.emit('match:error', { message: `User #${targetId} not found` });
          return;
        }

        if (targetDbUser.status === 'banned') {
          socket.emit('match:error', { message: 'This user is currently unavailable' });
          return;
        }

        const targetOnline = matchingService.getOnlineUserByPublicId(targetId);
        if (!targetOnline) {
          socket.emit('match:error', { message: `User #${targetId} is not online right now` });
          return;
        }

        if (socket.userDocId && matchingService.isBlocked(socket.userDocId, targetOnline.userId)) {
          socket.emit('match:error', { message: 'Cannot connect with this user.' });
          return;
        }

        const roomName = `Direct Chat #${socket.publicId} & #${targetId}`;
        const newRoom = new Room({
          name: roomName,
          description: `Direct conversation between #${socket.publicId} and #${targetId}`,
          roomType: 'stranger_chat',
          isDefault: false,
          isPublic: true,
          status: 'active',
          participants: [socket.userDocId, targetOnline.userId],
          observers: [],
          activeUsers: [
            { userId: socket.userDocId, username: socket.username, publicId: socket.publicId, role: 'participant', joinedAt: new Date() },
            { userId: targetOnline.userId, username: targetOnline.username, publicId: targetOnline.publicId, role: 'participant', joinedAt: new Date() },
          ],
        });

        await newRoom.save();

        const sockTarget = io.sockets.sockets.get(targetOnline.socketId);
        socket.join(newRoom._id.toString());
        if (sockTarget) sockTarget.join(newRoom._id.toString());

        socket.emit('match:found', {
          roomId: newRoom._id.toString(),
          roomName: newRoom.name,
          partner: {
            publicId: targetOnline.publicId,
            username: targetOnline.username,
            gender: targetOnline.gender,
          },
          role: 'participant',
        });

        if (sockTarget) {
          sockTarget.emit('match:found', {
            roomId: newRoom._id.toString(),
            roomName: newRoom.name,
            partner: {
              publicId: socket.publicId,
              username: socket.username,
              gender: socket.gender,
            },
            role: 'participant',
          });
        }

        io.emit('rooms_updated');
      } catch (error) {
        logger.error('Error in match:direct_request:', error);
        socket.emit('match:error', { message: 'Failed to create direct match' });
      }
    });

    // Join room (participants or read-only observers)
    socket.on('join_room', async (data: JoinRoomData) => {
      try {
        const { roomId } = data;

        const room = await Room.findOne({ _id: roomId, isDeleted: false });
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        const isParticipant =
          room.roomType === 'channel' ||
          room.participants?.some((p) => p.toString() === socket.userDocId) ||
          room.activeUsers?.some(
            (u) =>
              u.role === 'participant' &&
              (u.userId?.toString() === socket.userDocId ||
               u.username === socket.username ||
               u.publicId === socket.publicId)
          ) ||
          socket.role === 'admin';

        const role = isParticipant ? 'participant' : 'observer';

        // If observer, add to room.observers in database if not already tracked
        if (!isParticipant && socket.userDocId) {
          if (!room.observers.some((o) => o.toString() === socket.userDocId)) {
            room.observers.push(socket.userDocId as any);
            await room.save();
          }
        }

        socket.join(roomId);

        logger.info(`${socket.username} joined room ${room.name} as ${role}`);

        io.to(roomId).emit('user_joined', {
          username: socket.username,
          publicId: socket.publicId,
          role,
          timestamp: new Date(),
        });

        socket.emit('joined_room', {
          roomId,
          roomName: room.name,
          roomType: room.roomType,
          role,
          isPublic: room.isPublic,
          observerCount: room.observers?.length || 0,
        });
      } catch (error) {
        logger.error('Error joining room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Leave room
    socket.on('leave_room', async (data: JoinRoomData) => {
      try {
        const { roomId } = data;
        socket.leave(roomId);
        logger.info(`${socket.username} left room ${roomId}`);

        io.to(roomId).emit('user_left', {
          username: socket.username,
          publicId: socket.publicId,
          timestamp: new Date(),
        });
      } catch (error) {
        logger.error('Error leaving room:', error);
      }
    });

    // Send message (SERVER-ENFORCED OBSERVER RESTRICTION)
    socket.on('send_message', async (data: SendMessageData) => {
      try {
        const { roomId, text, attachment } = data;

        const hasAttachment = attachment && attachment.fileId;
        const hasText = text && text.trim().length > 0;

        if (!hasText && !hasAttachment) {
          socket.emit('error', { message: 'Message text or attachment is required' });
          return;
        }

        if (text && text.length > 2000) {
          socket.emit('error', { message: 'Message too long (max 2000 characters)' });
          return;
        }

        const room = await Room.findOne({ _id: roomId, isDeleted: false });
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        // STRICT SERVER-SIDE AUTHORIZATION: Observers cannot send direct chat messages!
        if (room.roomType === 'stranger_chat') {
          const isParticipant =
            room.participants?.some((p) => p.toString() === socket.userDocId) ||
            room.activeUsers?.some(
              (u) =>
                u.role === 'participant' &&
                (u.userId?.toString() === socket.userDocId ||
                 u.username === socket.username ||
                 u.publicId === socket.publicId)
            ) ||
            socket.role === 'admin';
          if (!isParticipant) {
            socket.emit('error', {
              message: 'Observers cannot send direct chat messages. Use suggestions instead.',
            });
            return;
          }
        }

        // Save message to database
        const messageData: Record<string, unknown> = {
          roomId,
          userId: socket.userDocId,
          username: socket.username,
          text: hasText ? text.trim() : '',
          messageType: hasAttachment ? 'media' : 'text',
        };

        if (hasAttachment) {
          messageData.attachment = {
            fileId: attachment.fileId,
            fileName: attachment.fileName,
            mimeType: attachment.mimeType,
            fileSize: attachment.fileSize,
            s3Key: attachment.s3Key,
          };
        }

        const message = new Message(messageData);
        await message.save();

        const emitData: Record<string, unknown> = {
          _id: message._id,
          roomId: message.roomId,
          userId: message.userId,
          username: message.username,
          publicId: socket.publicId,
          text: message.text,
          messageType: message.messageType,
          createdAt: message.createdAt,
        };

        if (message.attachment) {
          emitData.attachment = message.attachment;
        }

        io.to(roomId).emit('new_message', emitData);
        logger.info(`Message sent in room ${roomId} by #${socket.publicId} (${socket.username})`);
      } catch (error) {
        logger.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Observer submits a suggestion
    socket.on('chat:suggestion:send', async (data: SendSuggestionData) => {
      try {
        const { roomId, content } = data;
        if (!content || !content.trim()) {
          socket.emit('error', { message: 'Suggestion content cannot be empty' });
          return;
        }

        if (content.length > 500) {
          socket.emit('error', { message: 'Suggestion too long (max 500 characters)' });
          return;
        }

        // Anti-spam rate limit on observer suggestions (max 1 per 30s)
        const rateLimitKey = socket.userDocId || (socket.publicId ? String(socket.publicId) : socket.id);
        const lastSent = suggestionRateLimitMap.get(rateLimitKey) || 0;
        const now = Date.now();
        if (now - lastSent < SUGGESTION_COOLDOWN_MS) {
          const remainingSeconds = Math.ceil((SUGGESTION_COOLDOWN_MS - (now - lastSent)) / 1000);
          socket.emit('error', {
            message: 'Rate limit: Please wait ' + remainingSeconds + 's before submitting another suggestion.',
          });
          return;
        }
        suggestionRateLimitMap.set(rateLimitKey, now);

        const room = await Room.findOne({ _id: roomId, isDeleted: false });
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        const suggestion = new Suggestion({
          roomId: room._id,
          observerId: socket.userDocId,
          observerPublicId: socket.publicId,
          observerUsername: socket.username,
          content: content.trim(),
          visibleTo: [],
        });

        await suggestion.save();

        // Broadcast suggestion to the room
        io.to(roomId).emit('chat:suggestion:new', {
          _id: suggestion._id,
          roomId: suggestion.roomId,
          observerId: suggestion.observerId,
          observerPublicId: suggestion.observerPublicId,
          observerUsername: suggestion.observerUsername,
          content: suggestion.content,
          createdAt: suggestion.createdAt,
        });

        logger.info(`Suggestion sent in ${roomId} by observer #${socket.publicId}`);
      } catch (error) {
        logger.error('Error sending suggestion:', error);
        socket.emit('error', { message: 'Failed to submit suggestion' });
      }
    });

    // Participant toggles suggestion visibility
    socket.on('chat:suggestion:toggle_visibility', async (data: ToggleSuggestionData) => {
      try {
        const { suggestionId, visible } = data;
        const suggestion = await Suggestion.findById(suggestionId);
        if (!suggestion) return;

        if (visible) {
          if (!suggestion.visibleTo.some((id) => id.toString() === socket.userDocId)) {
            suggestion.visibleTo.push(socket.userDocId as any);
            await suggestion.save();
          }
        } else {
          suggestion.visibleTo = suggestion.visibleTo.filter(
            (id) => id.toString() !== socket.userDocId,
          );
          await suggestion.save();
        }

        socket.emit('chat:suggestion:visibility_updated', {
          suggestionId,
          visible,
        });
      } catch (error) {
        logger.error('Error toggling suggestion visibility:', error);
      }
    });

    // Typing indicator
    socket.on('typing_start', (data: TypingData) => {
      const { roomId } = data;
      socket.to(roomId).emit('user_typing', {
        username: socket.username,
        publicId: socket.publicId,
        isTyping: true,
      });
    });

    socket.on('typing_stop', (data: TypingData) => {
      const { roomId } = data;
      socket.to(roomId).emit('user_typing', {
        username: socket.username,
        publicId: socket.publicId,
        isTyping: false,
      });
    });

    // Rename Room handler (Both participants in stranger chat or room members can rename)
    socket.on('room:rename', async (data: { roomId: string; name: string }) => {
      try {
        const { roomId, name } = data;
        const cleanName = (name || '').trim();

        if (!cleanName || cleanName.length < 1 || cleanName.length > 50) {
          socket.emit('error', { message: 'Room name must be between 1 and 50 characters' });
          return;
        }

        const room = await Room.findOne({ _id: roomId, isDeleted: false });
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        // Validate user is a participant or member
        const isParticipant =
          room.roomType === 'channel' ||
          room.participants?.some((p) => p.toString() === socket.userDocId) ||
          room.activeUsers?.some(
            (u) =>
              u.role === 'participant' ||
              u.userId?.toString() === socket.userDocId ||
              u.username === socket.username ||
              u.publicId === socket.publicId
          ) ||
          socket.role === 'admin';

        if (!isParticipant) {
          socket.emit('error', { message: 'Only room participants can rename the room' });
          return;
        }

        room.name = cleanName;
        await room.save();

        // Create a system message announcing the rename
        const User = (await import('../models/user')).default;
        const systemUser = await User.findOne({ role: 'admin' });
        const systemMessage = new Message({
          roomId: room._id,
          userId: systemUser?._id || socket.userDocId,
          username: 'System',
          text: `${socket.username} (#${socket.publicId}) renamed the room to "${cleanName}"`,
          messageType: 'system',
        });
        await systemMessage.save();

        // Broadcast to all participants and observers in this room
        io.to(roomId).emit('room:renamed', {
          roomId: room._id.toString(),
          name: cleanName,
          renamedBy: socket.username,
          renamedByPublicId: socket.publicId,
        });

        // Broadcast system message
        io.to(roomId).emit('new_message', {
          _id: systemMessage._id,
          roomId: systemMessage.roomId,
          userId: systemMessage.userId,
          username: systemMessage.username,
          text: systemMessage.text,
          messageType: systemMessage.messageType,
          createdAt: systemMessage.createdAt,
        });

        // Broadcast global rooms updated so channel lists update
        io.emit('rooms_updated');
      } catch (error) {
        logger.error('Error renaming room:', error);
        socket.emit('error', { message: 'Failed to rename room' });
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      matchingService.unregisterSocket(socket.id);
      logger.info(`User disconnected: #${socket.publicId} (${socket.username}) on ${socket.id}`);
    });
  });

  return io;
};
