import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

import { connectDB } from "./db.js";
import { authMiddleware, JWT_SECRET } from "./middleware/auth.js";
import { upload } from "./config/multer.js";
import { ensureUploadsDir } from "./config/uploadsDir.js";
import {
  isCloudinaryEnabled,
  uploadProductImageToCloudinary,
  deleteProductImageFromCloudinary,
} from "./config/cloudinaryUpload.js";
import User from "./models/User.js";
import Product from "./models/Product.js";
import Service from "./models/Service.js";
import Message from "./models/Message.js";
import ProductClick from "./models/ProductClick.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

const uploadsDir = ensureUploadsDir();

if (isCloudinaryEnabled()) {
  console.log("[uploads] Cloudinary enabled — new product images go to the cloud.");
}

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

connectDB().catch((err) => {
  console.error("DB connection failed:", err);
  process.exit(1);
});

function toProductJSON(doc) {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    id: o._id?.toString(),
    _id: o._id?.toString(),
    name: o.name,
    price: o.price,
    tag: o.tag || null,
    description: o.description || null,
    image: o.image || null,
    in_stock: o.in_stock !== false,
    created_at: o.createdAt,
    updated_at: o.updatedAt,
  };
}

// Auth
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }
    const user = await User.findOne({ email });
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const token = jwt.sign(
      { id: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({ token, user: { id: user._id.toString(), email: user.email } });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/auth/me", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

app.patch("/api/auth/password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword || String(newPassword).length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters" });
    }
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
      return res.status(401).json({ error: "Current password incorrect" });
    }
    user.password_hash = bcrypt.hashSync(newPassword, 10);
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.patch("/api/auth/email", authMiddleware, async (req, res) => {
  try {
    const { newEmail, currentPassword } = req.body || {};
    if (!newEmail || !currentPassword) {
      return res.status(400).json({ error: "New email and current password required" });
    }
    const normalized = String(newEmail).trim().toLowerCase();
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
      return res.status(401).json({ error: "Current password incorrect" });
    }
    const exists = await User.findOne({ email: normalized });
    if (exists && exists._id.toString() !== user._id.toString()) {
      return res.status(409).json({ error: "Email already in use" });
    }
    user.email = normalized;
    await user.save();
    const token = jwt.sign(
      { id: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({ token, user: { id: user._id.toString(), email: user.email } });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Products (public GET, protected POST with image upload)
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 }).lean();
    res.json(
      products.map((p) => ({
        id: p._id.toString(),
        _id: p._id.toString(),
        name: p.name,
        price: p.price,
        tag: p.tag || null,
        description: p.description || null,
        image: p.image || null,
        in_stock: p.in_stock !== false,
        created_at: p.createdAt,
        updated_at: p.updatedAt,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/products", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    const { name, price, tag, description, in_stock } = req.body || {};
    if (!name || !price) {
      return res.status(400).json({ error: "Name and price required" });
    }
    let imagePath = null;
    if (req.file) {
      if (isCloudinaryEnabled()) {
        imagePath = await uploadProductImageToCloudinary(req.file.buffer, req.file.mimetype);
      } else {
        imagePath = "/uploads/" + req.file.filename;
      }
    }
    const stocked =
      in_stock === "false" || in_stock === false || in_stock === "0" ? false : true;
    const product = await Product.create({
      name,
      price: price || "",
      tag: tag || null,
      description: description?.trim() ? description.trim() : null,
      image: imagePath,
      in_stock: stocked,
    });
    res.status(201).json(toProductJSON(product));
  } catch (err) {
    res.status(500).json({ error: err.message || "Server error" });
  }
});

app.put("/api/products/:id", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    const { name, price, tag, description, in_stock } = req.body || {};
    const id = req.params.id;
    const existing = await Product.findById(id);
    if (!existing) return res.status(404).json({ error: "Product not found" });

    const update = {
      name: name !== undefined && String(name).trim() !== "" ? name : existing.name,
      price: price !== undefined && String(price).trim() !== "" ? price : existing.price,
      tag: tag !== undefined ? (tag || null) : existing.tag,
      description:
        description !== undefined
          ? String(description).trim() || null
          : existing.description ?? null,
      image: existing.image,
    };
    if (in_stock !== undefined && in_stock !== "") {
      update.in_stock =
        in_stock === "true" || in_stock === true || in_stock === "1";
    } else {
      update.in_stock = existing.in_stock !== false;
    }
    if (req.file) {
      if (existing.image) {
        const prev = String(existing.image);
        if (prev.startsWith("/uploads/")) {
          const oldFile = path.join(uploadsDir, path.basename(prev));
          if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
        } else if (prev.includes("res.cloudinary.com")) {
          await deleteProductImageFromCloudinary(prev);
        }
      }
      if (isCloudinaryEnabled()) {
        update.image = await uploadProductImageToCloudinary(req.file.buffer, req.file.mimetype);
      } else {
        update.image = "/uploads/" + req.file.filename;
      }
    }
    const product = await Product.findByIdAndUpdate(id, update, { new: true });
    res.json(toProductJSON(product));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/products/:id", authMiddleware, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (product?.image) {
      const img = String(product.image);
      if (img.startsWith("/uploads/")) {
        const filePath = path.join(uploadsDir, path.basename(img));
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } else if (img.includes("res.cloudinary.com")) {
        await deleteProductImageFromCloudinary(img);
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Services
app.get("/api/services", async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 }).lean();
    res.json(
      services.map((s) => ({
        id: s._id.toString(),
        title: s.title,
        desc: s.desc,
        icon: s.icon || "Camera",
        accent: s.accent || "from-primary to-primary/60",
        created_at: s.createdAt,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/services", authMiddleware, async (req, res) => {
  try {
    const { title, desc, icon, accent } = req.body || {};
    if (!title || !desc) {
      return res.status(400).json({ error: "Title and description required" });
    }
    const service = await Service.create({
      title,
      desc: desc || "",
      icon: icon || "Camera",
      accent: accent || "from-primary to-primary/60",
    });
    res.status(201).json({
      id: service._id.toString(),
      title: service.title,
      desc: service.desc,
      icon: service.icon,
      accent: service.accent,
      created_at: service.createdAt,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Server error" });
  }
});

app.put("/api/services/:id", authMiddleware, async (req, res) => {
  try {
    const { title, desc, icon, accent } = req.body || {};
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      {
        ...(title != null && { title }),
        ...(desc != null && { desc }),
        ...(icon != null && { icon }),
        ...(accent != null && { accent }),
      },
      { new: true }
    );
    if (!service) return res.status(404).json({ error: "Service not found" });
    res.json({
      id: service._id.toString(),
      title: service.title,
      desc: service.desc,
      icon: service.icon,
      accent: service.accent,
      created_at: service.createdAt,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/services/:id", authMiddleware, async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ error: "Service not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Messages
app.get("/api/messages", authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 }).lean();
    res.json(
      messages.map((m) => ({
        id: m._id.toString(),
        ...m,
        created_at: m.createdAt,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/messages", async (req, res) => {
  try {
    const { name, email, phone, service, message } = req.body || {};
    if (!name || !email) {
      return res.status(400).json({ error: "Name and email required" });
    }
    const msg = await Message.create({
      name,
      email,
      phone: phone || null,
      service: service || null,
      message: message || null,
    });
    res.status(201).json({
      id: msg._id.toString(),
      ...msg.toObject(),
      created_at: msg.createdAt,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Product clicks
app.post("/api/product-clicks", async (req, res) => {
  try {
    const { product_id, product_name } = req.body || {};
    if (!product_name) {
      return res.status(400).json({ error: "Product name required" });
    }
    await ProductClick.create({
      product_id: product_id || null,
      product_name,
    });
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

/** Public leaderboard for “frequently requested” products on the marketing site */
app.get("/api/product-clicks/popular", async (req, res) => {
  try {
    const raw = parseInt(String(req.query.limit || "8"), 10);
    const limit = Number.isFinite(raw) ? Math.min(Math.max(raw, 1), 24) : 8;
    const rows = await ProductClick.aggregate([
      {
        $group: {
          _id: "$product_name",
          product_name: { $first: "$product_name" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]);
    res.json({
      popular: rows.map((r) => ({
        product_name: r.product_name,
        count: r.count,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/product-clicks", authMiddleware, async (req, res) => {
  try {
    const clicks = await ProductClick.aggregate([
      {
        $group: {
          _id: "$product_name",
          product_name: { $first: "$product_name" },
          product_id: { $first: "$product_id" },
          count: { $sum: 1 },
          last_click: { $max: "$createdAt" },
        },
      },
      { $sort: { count: -1 } },
    ]);
    const total = await ProductClick.countDocuments();
    res.json({
      clicks: clicks.map((c) => ({
        product_name: c.product_name,
        product_id: c.product_id,
        count: c.count,
        last_click: c.last_click,
      })),
      total,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
