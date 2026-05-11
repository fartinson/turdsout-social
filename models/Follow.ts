import { Schema, model, models, type InferSchemaType } from "mongoose";

const FollowSchema = new Schema(
  {
    followerUserId: { type: String, required: true, index: true },
    followedUserId: { type: String, required: true, index: true },
  },
  { timestamps: true },
);

FollowSchema.index({ followerUserId: 1, followedUserId: 1 }, { unique: true });
FollowSchema.index({ followedUserId: 1, createdAt: -1 });
FollowSchema.index({ followerUserId: 1, createdAt: -1 });

export type FollowDoc = InferSchemaType<typeof FollowSchema> & { _id: unknown };

export const Follow = models.Follow || model("Follow", FollowSchema);
