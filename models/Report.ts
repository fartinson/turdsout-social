import { Schema, model, models, type InferSchemaType } from "mongoose";

const ReportSchema = new Schema(
  {
    postId: { type: Schema.Types.ObjectId, required: true, index: true },
    reporterUserId: { type: String, required: true, index: true },
    reason: { type: String, required: true },
  },
  { timestamps: true },
);

ReportSchema.index({ postId: 1, reporterUserId: 1 }, { unique: true });

export type ReportDoc = InferSchemaType<typeof ReportSchema> & { _id: unknown };

export const Report = models.Report || model("Report", ReportSchema);
