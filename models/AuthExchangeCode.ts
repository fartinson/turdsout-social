import { Schema, model, models, type InferSchemaType } from "mongoose";

/** One-time exchange after email magic link (native clients). */
const AuthExchangeCodeSchema = new Schema(
  {
    codeHash: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type AuthExchangeCodeDoc = InferSchemaType<
  typeof AuthExchangeCodeSchema
> & { _id: unknown };

export const AuthExchangeCode =
  models.AuthExchangeCode ||
  model("AuthExchangeCode", AuthExchangeCodeSchema);
