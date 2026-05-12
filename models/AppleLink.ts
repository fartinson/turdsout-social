import { Schema, model, models, type InferSchemaType } from "mongoose";

/** Maps Apple `sub` to NextAuth user id (Mongo ObjectId string). */
const AppleLinkSchema = new Schema(
  {
    appleSub: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
  },
  { timestamps: true },
);

export type AppleLinkDoc = InferSchemaType<typeof AppleLinkSchema> & {
  _id: unknown;
};

export const AppleLink =
  models.AppleLink || model("AppleLink", AppleLinkSchema);
