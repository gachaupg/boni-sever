import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User.js";
import Product from "./models/Product.js";
import Service from "./models/Service.js";

const MONGODB_URL =
  process.env.MONGODB_URL ||
  "mongodb+srv://peter:35407835@nodejsandexpress.kvscu.mongodb.net/boni?retryWrites=true&w=majority&appName=nodejsandexpress";

export async function connectDB() {
  await mongoose.connect(MONGODB_URL);
  console.log("MongoDB connected");

  await seedAdmin();
  await seedProducts();
  await seedServices();
}

async function seedAdmin() {
  const exists = await User.findOne({ email: "admin@gmail.com" });
  if (!exists) {
    const hash = bcrypt.hashSync("12345678", 10);
    await User.create({ email: "admin@gmail.com", password_hash: hash });
    console.log("Admin user created (admin@gmail.com / 12345678)");
  }
}

async function seedProducts() {
  const count = await Product.countDocuments();
  if (count === 0) {
    const defaultProducts = [
      { name: "Centurion D5 Evo Sliding Gate Motor", price: "KSh 58,500", tag: "Popular", image: null },
      { name: "Centurion D6 Smart Sliding Gate Motor", price: "KSh 62,000", tag: null, image: null },
      { name: "Centurion D3 Smart Gate Motor", price: "KSh 45,000", tag: "Budget", image: null },
      { name: "Centurion Vantage 500 Swing Gate", price: "KSh 95,000", tag: "Premium", image: null },
      { name: "Centurion D10 Smart Gate Motor", price: "KSh 118,000", tag: "Heavy Duty", image: null },
      { name: "Centurion D2 Turbo Sliding Gate Kit", price: "KSh 42,000", tag: "Best Value", image: null },
      { name: "Automatic Sliding Gate Opener Wi-Fi", price: "KSh 100,000", tag: "Smart", image: null },
      { name: "Complete Swing Gate Motor Kit + Backup", price: "KSh 118,000", tag: null, image: null },
    ];
    await Product.insertMany(defaultProducts);
    console.log("Default products seeded");
  }
}

async function seedServices() {
  const count = await Service.countDocuments();
  if (count === 0) {
    const defaultServices = [
      { title: "CCTV Installation", desc: "HD & IP camera systems with remote viewing, night vision, and cloud storage for homes and businesses.", icon: "Camera", accent: "from-primary to-primary/60" },
      { title: "Gate Automation", desc: "Sliding & swing gate motors from top brands like Centurion. Smart access with remote control and Wi-Fi.", icon: "DoorOpen", accent: "from-secondary to-secondary/60" },
      { title: "Smart Access Control", desc: "Keypads, intercoms, biometric readers, and mobile-controlled entry systems for maximum security.", icon: "Wifi", accent: "from-primary to-secondary" },
      { title: "Maintenance & Repair", desc: "Preventive maintenance plans and rapid response repair services to keep your systems running 24/7.", icon: "Wrench", accent: "from-secondary to-primary" },
    ];
    await Service.insertMany(defaultServices);
    console.log("Default services seeded");
  }
}
