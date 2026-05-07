import { Schema, model, models, type InferSchemaType } from "mongoose";

const VoteSchema = new Schema(
  {
    postId: { type: Schema.Types.ObjectId, required: true, index: true },
    userId: { type: String, required: true, index: true },
    value: { type: Number, enum: [-1, 1], required: true },
  },
  { timestamps: true },
);

VoteSchema.index({ postId: 1, userId: 1 }, { unique: true });

export type VoteDoc = InferSchemaType<typeof VoteSchema> & { _id: unknown };

export const Vote = models.Vote || model("Vote", VoteSchema);
