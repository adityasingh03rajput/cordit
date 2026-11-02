import { logger } from '../utils/logger';
import Block from '../models/block';

export interface QueueUser {
  socketId: string;
  userId: string;
  username: string;
  publicId: number;
  gender: 'male' | 'female' | 'other';
  genderPreference: 'male' | 'female' | 'any';
  queuedAt: number;
}

export interface MatchResult {
  matched: boolean;
  userA?: QueueUser;
  userB?: QueueUser;
  queueLength?: number;
}

export interface OnlineUserRecord {
  socketId: string;
  userId: string;
  username: string;
  publicId: number;
  gender: 'male' | 'female' | 'other';
  genderPreference: 'male' | 'female' | 'any';
}

class MatchingService {
  private randomQueue: QueueUser[] = [];
  private onlineUsers: Map<string, OnlineUserRecord> = new Map(); // socketId -> OnlineUserRecord
  private publicIdToSocketId: Map<number, string> = new Map(); // publicId -> socketId
  private blockCache: Set<string> = new Set(); // "blockerId:blockedId"

  /**
   * Initializes block cache from MongoDB.
   */
  public async loadBlocksFromDb(): Promise<void> {
    try {
      const allBlocks = await Block.find({});
      this.blockCache.clear();
      for (const b of allBlocks) {
        this.blockCache.add(`${b.blockerId.toString()}:${b.blockedId.toString()}`);
      }
      logger.info(`Loaded ${this.blockCache.size} block relations into matching cache`);
    } catch (err) {
      logger.error('Failed to load blocks into matching cache:', err);
    }
  }

  public addBlock(blockerId: string, blockedId: string): void {
    this.blockCache.add(`${blockerId}:${blockedId}`);
  }

  public removeBlock(blockerId: string, blockedId: string): void {
    this.blockCache.delete(`${blockerId}:${blockedId}`);
  }

  public isBlocked(idA: string, idB: string): boolean {
    return this.blockCache.has(`${idA}:${idB}`) || this.blockCache.has(`${idB}:${idA}`);
  }

  /**
   * Registers a connected socket with user identity.
   */
  public registerSocket(record: OnlineUserRecord): void {
    this.onlineUsers.set(record.socketId, record);
    this.publicIdToSocketId.set(record.publicId, record.socketId);
    logger.info(`User #${record.publicId} (${record.username}) registered on socket ${record.socketId}`);
  }

  /**
   * Removes socket from online tracking and random queue upon disconnect.
   */
  public unregisterSocket(socketId: string): void {
    const user = this.onlineUsers.get(socketId);
    if (user) {
      this.publicIdToSocketId.delete(user.publicId);
      this.onlineUsers.delete(socketId);
      this.removeFromQueue(socketId);
      logger.info(`User #${user.publicId} unregistered from socket ${socketId}`);
    }
  }

  /**
   * Gets online user details by publicId for direct matching.
   */
  public getOnlineUserByPublicId(publicId: number): OnlineUserRecord | undefined {
    const socketId = this.publicIdToSocketId.get(publicId);
    if (!socketId) return undefined;
    return this.onlineUsers.get(socketId);
  }

  /**
   * Checks mutual compatibility between two users based on their gender, preferences, and blocks.
   * Both sides must satisfy the other's preference, and neither may have blocked the other.
   */
  public isMutuallyCompatible(userA: QueueUser, userB: QueueUser): boolean {
    if (userA.userId === userB.userId || userA.publicId === userB.publicId) {
      return false;
    }

    // Check block list: blocked users cannot match
    if (this.isBlocked(userA.userId, userB.userId)) {
      return false;
    }

    const aAcceptsB = userA.genderPreference === 'any' || userA.genderPreference === userB.gender;
    const bAcceptsA = userB.genderPreference === 'any' || userB.genderPreference === userA.gender;

    return aAcceptsB && bAcceptsA;
  }

  /**
   * Enters the mutual-preference random matching queue.
   */
  public addToRandomQueue(user: QueueUser): MatchResult {
    this.removeFromQueue(user.userId);

    const matchIndex = this.randomQueue.findIndex((candidate) =>
      this.isMutuallyCompatible(user, candidate),
    );

    if (matchIndex !== -1) {
      const matchedPartner = this.randomQueue.splice(matchIndex, 1)[0];
      logger.info(
        `[MATCH FOUND] #${matchedPartner.publicId} (${matchedPartner.gender}) <-> #${user.publicId} (${user.gender})`,
      );
      return {
        matched: true,
        userA: matchedPartner,
        userB: user,
      };
    }

    this.randomQueue.push(user);
    logger.info(`User #${user.publicId} queued for random matching. Queue size: ${this.randomQueue.length}`);

    return {
      matched: false,
      queueLength: this.randomQueue.length,
    };
  }

  /**
   * Removes a user from the random matching queue by userId or socketId.
   */
  public removeFromQueue(id: string): boolean {
    const initialLen = this.randomQueue.length;
    this.randomQueue = this.randomQueue.filter(
      (u) => u.userId !== id && u.socketId !== id,
    );
    return this.randomQueue.length < initialLen;
  }

  public isUserInQueue(userId: string): boolean {
    return this.randomQueue.some((u) => u.userId === userId);
  }

  public getQueueCount(): number {
    return this.randomQueue.length;
  }
}

export const matchingService = new MatchingService();
