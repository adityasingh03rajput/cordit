import mongoose, { Document, Schema } from 'mongoose';

export type UserGender = 'male' | 'female' | 'other';
export type GenderPreference = 'male' | 'female' | 'any';
export type UserAccountStatus = 'active' | 'suspended' | 'banned';

export interface IUser extends Document {
  username: string;
  publicId: number;
  password: string;
  role: 'admin' | 'user';
  gender: UserGender;
  genderPreference: GenderPreference;
  status: UserAccountStatus;
  refreshToken?: string;
  isDeleted?: boolean;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    publicId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      default: 'other',
    },
    genderPreference: {
      type: String,
      enum: ['male', 'female', 'any'],
      default: 'any',
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'banned'],
      default: 'active',
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    refreshToken: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model<IUser>('User', userSchema);
