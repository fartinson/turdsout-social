import { Schema, model, models, type InferSchemaType } from "mongoose";

const ReplySchema = new Schema(
  {
    postId: { type: Schema.Types.ObjectId, required: true, index: true },
    authorUserId: { type: String, required: true, index: true },
    body: { type: String, required: true },
    status: {
      type: String,
      enum: ["live", "hidden"],
      default: "live",
      index: true,
    },
  },
  { timestamps: true },
);

ReplySchema.index({ postId: 1, _id: 1 });

export type ReplyDoc = InferSchemaType<typeof ReplySchema> & { _id: unknown };

export const Reply = models.Reply || model("Reply", ReplySchema);
