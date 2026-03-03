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

Product images are stored in the `uploads/` folder using Multer. Max file size: 5MB. Accepted formats: jpeg, jpg, png, gif, webp.

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
