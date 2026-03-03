import mongoose from "mongoose";

const productClickSchema = new mongoose.Schema(
  {
    product_id: { type: mongoose.Schema.Types.ObjectId, default: null },
    product_name: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("ProductClick", productClickSchema);
