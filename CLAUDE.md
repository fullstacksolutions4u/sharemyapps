# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
# Run both client and server concurrently (from root)
npm run dev

# Install all dependencies (root + client + server)
npm run install:all

# Client only (port 3000)
cd client && npm run dev

# Server only (port 5000, with nodemon)
cd server && npm run dev
```

### Build & Lint
```bash
# Build client for production
cd client && npm run build

# Lint client code
cd client && npm run lint
```

### No test suite is configured. CI runs lint + build only.

## Architecture

**ShareMyApps** is a full-stack platform for developers to showcase and share side projects with clients/recruiters.

### Stack
- **Frontend**: React 19 + Vite (port 3000), React Router 7, Tailwind CSS 4, Axios
- **Backend**: Express on Node.js (port 5000), MongoDB + Mongoose, Passport.js (Google OAuth), Cloudinary (image uploads)
- **Deployment**: Vercel (client), Render (server)

### Client–Server Split
In development, Vite proxies `/api/*` to `http://localhost:5000` — the client never calls the server directly by hostname. In production, `VITE_API_URL` points to the Render backend and Axios uses that as its base URL (see [client/src/api/axios.js](client/src/api/axios.js)).

### Authentication Flow
1. Register/login returns a JWT; stored in `localStorage` and set as an `httpOnly` cookie.
2. [client/src/api/axios.js](client/src/api/axios.js) attaches `Authorization: Bearer <token>` to every request via an interceptor; 401 responses auto-clear the token and redirect to `/login`.
3. On page load, `AuthContext` calls `/api/auth/me` to restore session state.
4. Google OAuth: Passport creates/links the user, then redirects to the frontend with the token as a URL query param.
5. Server middleware: `protect` validates the JWT; `requireAdmin` gates admin routes.

### User Roles & Route Access
- **guest**: public pages (`/`, `/explore`, `/project/:id`, `/portfolio/:userId`)
- **developer** (authenticated): dashboard, add/edit projects, messages, notifications, profile
- **client** (authenticated): client-profile page (find developers)
- **admin**: `/admin` moderation panel

Project moderation status: `pending → approved | rejected`. Only approved projects appear publicly.

### Key Data Models ([server/models/](server/models/))
- **User**: email+password or Google OAuth; roles (`user`/`admin`); userType (`developer`/`client`); `toPublicJSON()` strips the password hash.
- **Project**: owned by a User; status workflow (`pending/approved/rejected`); likes (User refs), ratings (1–5), embedded text index on title+description for search.
- **Message**: sender→recipient with optional project reference; indexed on `recipient + createdAt`.
- **Comment**: belongs to a Project + User; indexed on `project + createdAt`.
- **Notification**: delivered when admin approves/rejects a project (`approved`/`rejected`/`resubmit` types).

### Image Uploads
Custom Multer + Cloudinary storage engine ([server/middleware/upload.js](server/middleware/upload.js)). Projects support one banner image and up to 5 screenshots; 5 MB limit, auto-resized to 1200 px width.

## Environment Variables

**Server** (`server/.env`):
```
MONGO_URI=
JWT_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
CLIENT_URL=http://localhost:5173
PORT=5000
NODE_ENV=development
```

**Client** (`client/.env.local`):
```
VITE_API_URL=https://sharemyapps.onrender.com
```
In development, `VITE_API_URL` is not needed — the Vite proxy handles `/api` calls.
