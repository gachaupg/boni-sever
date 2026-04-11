import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Folder where Multer saves product images (same path Express serves at /uploads).
 * Set UPLOADS_DIR to an absolute path on a persistent volume (e.g. Render Disk) so files survive deploys.
 * If unset, uses `uploads/` next to this package root (ephemeral on many hosts).
 */
export function getUploadsDir() {
  const env = process.env.UPLOADS_DIR?.trim();
  if (env) {
    return path.isAbsolute(env) ? env : path.resolve(process.cwd(), env);
  }
  return path.join(__dirname, "..", "uploads");
}

export function ensureUploadsDir() {
  const dir = getUploadsDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}
