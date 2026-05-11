import { Schema, model, models, type InferSchemaType } from "mongoose";

const DeviceSessionSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: { type: Date, default: null },
    /** Opaque device id from client (for Turnstile trust binding). */
    deviceId: { type: String, default: null, index: true },
    userAgent: { type: String, default: null },
    /** After a successful Turnstile check, native clients skip captcha until this time. */
    turnstileTrustedUntil: { type: Date, default: null },
  },
  { timestamps: true },
);

DeviceSessionSchema.index({ userId: 1, expiresAt: -1 });

export type DeviceSessionDoc = InferSchemaType<typeof DeviceSessionSchema> & {
  _id: unknown;
};

export const DeviceSession =
  models.DeviceSession || model("DeviceSession", DeviceSessionSchema);
