import { v2 as cloudinary } from "cloudinary";

export function isCloudinaryEnabled() {
  const url = process.env.CLOUDINARY_URL?.trim();
  const name = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const key = process.env.CLOUDINARY_API_KEY?.trim();
  const secret = process.env.CLOUDINARY_API_SECRET?.trim();
  return Boolean(url || (name && key && secret));
}

if (isCloudinaryEnabled()) {
  if (!process.env.CLOUDINARY_URL?.trim()) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }
}

/**
 * Derive public_id from a delivery URL for destroy().
 * Handles optional transformations and /v1234567/ version segments.
 */
export function cloudinaryPublicIdFromUrl(url) {
  if (!url || typeof url !== "string" || !url.includes("res.cloudinary.com")) return null;
  const marker = "/upload/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  let tail = url.slice(idx + marker.length);
  const segments = tail.split("/").filter(Boolean);
  let start = 0;
  while (start < segments.length) {
    const seg = segments[start];
    if (seg.includes(",") || seg.startsWith("s--")) {
      start += 1;
      continue;
    }
    if (/^v\d+$/i.test(seg)) {
      start += 1;
      continue;
    }
    break;
  }
  const pathPart = segments.slice(start).join("/");
  if (!pathPart) return null;
  return pathPart.replace(/\.[^/.]+$/, "") || null;
}

export async function uploadProductImageToCloudinary(buffer, mimetype) {
  const type = mimetype && String(mimetype).startsWith("image/") ? mimetype : "image/jpeg";
  const dataUri = `data:${type};base64,${buffer.toString("base64")}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: "prime-eagle-products",
    resource_type: "image",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
  });
  return result.secure_url;
}

export async function deleteProductImageFromCloudinary(imageUrl) {
  const publicId = cloudinaryPublicIdFromUrl(imageUrl);
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image", invalidate: true });
  } catch {
    // ignore missing / already deleted
  }
}
