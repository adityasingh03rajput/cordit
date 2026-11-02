import mongoose, { Document, Schema, Types } from 'mongoose';

export type ReportStatus = 'pending' | 'reviewed' | 'dismissed';

export interface IReport extends Document {
  reporterId: Types.ObjectId;
  reporterPublicId: number;
  reportedUserId: Types.ObjectId;
  reportedPublicId: number;
  roomId?: Types.ObjectId;
  reason: string;
  status: ReportStatus;
  actionTaken?: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reporterPublicId: {
      type: Number,
      required: true,
    },
    reportedUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reportedPublicId: {
      type: Number,
      required: true,
      index: true,
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
    },
    reason: {
      type: String,
      required: true,
      maxlength: 1000,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'dismissed'],
      default: 'pending',
      index: true,
    },
    actionTaken: {
      type: String,
      maxlength: 500,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

reportSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model<IReport>('Report', reportSchema);

