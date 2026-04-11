import multer from "multer";
import path from "path";
import { ensureUploadsDir } from "./uploadsDir.js";
import { isCloudinaryEnabled } from "./cloudinaryUpload.js";

const uploadDir = ensureUploadsDir();

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, uniqueSuffix + ext);
  },
});

const storage = isCloudinaryEnabled() ? multer.memoryStorage() : diskStorage;

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/i;
  const ext = path.extname(file.originalname)?.slice(1) || "";
  const mimetype = file.mimetype;
  if (allowed.test(ext) || allowed.test(mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});
