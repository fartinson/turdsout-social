import { Schema, model, models, type InferSchemaType } from "mongoose";

const PrivacySchema = new Schema(
  {
    showInFeed: { type: Boolean, default: true },
  },
  { _id: false },
);

const SettingsSchema = new Schema(
  {
    emailNotifications: { type: Boolean, default: false },
  },
  { _id: false },
);

const UserProfileSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, index: true },

    handle: {
      type: String,
      default: null,
      unique: true,
      sparse: true,
      index: true,
    },
    displayName: { type: String, default: null },
    avatarUrl: { type: String, default: null },

    privacy: { type: PrivacySchema, default: () => ({}) },
    settings: { type: SettingsSchema, default: () => ({}) },
  },
  { timestamps: true },
);

export type UserProfileDoc = InferSchemaType<typeof UserProfileSchema> & {
  _id: unknown;
};

export const UserProfile =
  models.UserProfile || model("UserProfile", UserProfileSchema);
