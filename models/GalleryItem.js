import mongoose from "mongoose";

const galleryItemSchema = new mongoose.Schema(
  {
    caption: { type: String, default: null },
    category: {
      type: String,
      enum: ["gates", "motors", "cctv-cameras", "others"],
      default: "others",
      required: true,
    },
    image: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("GalleryItem", galleryItemSchema);
