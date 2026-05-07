import { Schema, model, models, type InferSchemaType } from "mongoose";

const PostSchema = new Schema(
  {
    authorUserId: { type: String, required: true, index: true },
    body: { type: String, required: true },
    status: {
      type: String,
      enum: ["live", "hidden"],
      default: "live",
      index: true,
    },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    reports: { type: Number, default: 0 },
  },
  { timestamps: true },
);

PostSchema.index({ status: 1, createdAt: -1 });
PostSchema.index({ status: 1, upvotes: -1, createdAt: -1 });

export type PostDoc = InferSchemaType<typeof PostSchema> & { _id: unknown };

export const Post = models.Post || model("Post", PostSchema);
