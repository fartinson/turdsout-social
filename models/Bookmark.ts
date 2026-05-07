import { Schema, model, models, type InferSchemaType } from "mongoose";

const BookmarkSchema = new Schema(
  {
    postId: { type: Schema.Types.ObjectId, required: true, index: true },
    userId: { type: String, required: true, index: true },
  },
  { timestamps: true },
);

BookmarkSchema.index({ postId: 1, userId: 1 }, { unique: true });

export type BookmarkDoc = InferSchemaType<typeof BookmarkSchema> & {
  _id: unknown;
};

export const Bookmark = models.Bookmark || model("Bookmark", BookmarkSchema);
