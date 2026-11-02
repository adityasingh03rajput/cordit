import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IBlock extends Document {
  blockerId: Types.ObjectId;
  blockedId: Types.ObjectId;
  createdAt: Date;
}

const blockSchema = new Schema<IBlock>(
  {
    blockerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    blockedId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  },
);

blockSchema.index({ blockerId: 1, blockedId: 1 }, { unique: true });

export default mongoose.model<IBlock>('Block', blockSchema);

