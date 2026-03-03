import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    desc: { type: String, required: true },
    icon: { type: String, default: "Camera" },
    accent: { type: String, default: "from-primary to-primary/60" },
  },
  { timestamps: true }
);

export default mongoose.model("Service", serviceSchema);
