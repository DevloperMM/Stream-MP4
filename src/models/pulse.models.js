import mongoose, { Schema } from "mongoose";

const pulseSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
      maxLength: 1000,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Pulse = mongoose.model("Pulse", pulseSchema);
