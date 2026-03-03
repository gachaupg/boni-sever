import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: String, required: true },
    tag: { type: String, default: null },
    image: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
