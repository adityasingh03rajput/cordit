import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISuggestion extends Document {
  roomId: Types.ObjectId;
  observerId: Types.ObjectId;
  observerPublicId: number;
  observerUsername: string;
  content: string;
  visibleTo: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const suggestionSchema = new Schema<ISuggestion>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
      index: true,
    },
    observerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    observerPublicId: {
      type: Number,
      required: true,
    },
    observerUsername: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 500,
      trim: true,
    },
    visibleTo: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  },
);

suggestionSchema.index({ roomId: 1, createdAt: -1 });

export default mongoose.model<ISuggestion>('Suggestion', suggestionSchema);

