# Prime Eagle Admin API Server

Node.js backend with MongoDB and Multer for image uploads.

## Setup

1. Copy `.env.example` to `.env` and set your `MONGODB_URL`
2. Install and run:

```bash
cd server
npm install
npm run dev
```

Server runs at http://localhost:3001. The Vite dev server proxies `/api` and `/uploads` to this server.

## Database

Uses MongoDB. Connection string is in `.env`:
```
MONGODB_URL=mongodb+srv://...
```

## Image Uploads

Max file size: 5MB. Accepted formats: jpeg, jpg, png, gif, webp.

### Cloudinary (recommended for Render / production)

If **`CLOUDINARY_URL`** is set (from the Cloudinary dashboard → API Keys), new uploads go to **Cloudinary** and the API stores the **`https://res.cloudinary.com/...`** URL in MongoDB. Images survive deploys and restarts.

You can use **`CLOUDINARY_CLOUD_NAME`**, **`CLOUDINARY_API_KEY`**, and **`CLOUDINARY_API_SECRET`** instead of `CLOUDINARY_URL` if you prefer.

### Local disk (development or without Cloudinary)

If Cloudinary is **not** configured, Multer saves under **`UPLOADS_DIR`** or the default `server/server/uploads/` folder, served at `/uploads/...`. On ephemeral hosts, set **`UPLOADS_DIR`** to a path on a **persistent disk** (see Render docs) or uploads will disappear after deploy.

## Admin Login

- **Email:** admin@gmail.com
- **Password:** 12345678

## Endpoints

- `POST /api/auth/login` - Login (email, password)
- `GET /api/auth/me` - Current user (requires auth)
- `GET /api/products` - List products (public)
- `POST /api/products` - Add product (auth, multipart/form-data: name, price, tag, image)
- `PUT /api/products/:id` - Update product (auth, multipart/form-data)
- `DELETE /api/products/:id` - Delete product (auth)
- `GET /api/messages` - List contact form messages (auth)
- `POST /api/messages` - Submit message (public)
- `POST /api/product-clicks` - Record product click (public)
- `GET /api/product-clicks` - Click analytics (auth)
