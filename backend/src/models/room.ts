import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IActiveUser {
  userId: Types.ObjectId;
  username: string;
  publicId?: number;
  role?: 'participant' | 'observer';
  joinedAt: Date;
  isVoiceActive?: boolean;
  livekitParticipantId?: string;
}

export type RoomType = 'channel' | 'stranger_chat';
export type RoomStatus = 'active' | 'ended';

export interface IRoom extends Document {
  name: string;
  description?: string;
  isDefault: boolean;
  roomType: RoomType;
  status: RoomStatus;
  isPublic: boolean;
  participants: Types.ObjectId[];
  observers: Types.ObjectId[];
  activeUsers: IActiveUser[];
  maxUsers?: number;
  livekitRoomName?: string;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  endedAt?: Date;
}

const activeUserSchema = new Schema<IActiveUser>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    publicId: {
      type: Number,
    },
    role: {
      type: String,
      enum: ['participant', 'observer'],
      default: 'participant',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    isVoiceActive: {
      type: Boolean,
      default: false,
    },
    livekitParticipantId: {
      type: String,
    },
  },
  { _id: false },
);

const roomSchema = new Schema<IRoom>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    roomType: {
      type: String,
      enum: ['channel', 'stranger_chat'],
      default: 'channel',
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'ended'],
      default: 'active',
      index: true,
    },
    isPublic: {
      type: Boolean,
      default: true,
      index: true,
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    observers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    activeUsers: [activeUserSchema],
    maxUsers: {
      type: Number,
      default: 100,
    },
    livekitRoomName: {
      type: String,
      unique: true,
      sparse: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    endedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

roomSchema.index({ isDefault: 1 });
roomSchema.index({ isDeleted: 1 });
roomSchema.index({ status: 1, roomType: 1 });

export default mongoose.model<IRoom>('Room', roomSchema);
