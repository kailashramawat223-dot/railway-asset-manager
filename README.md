# 🚂 RailTrack — Railway Asset Management System

A full-stack web application to manage railway assets with QR code tracking, multi-user authentication, CRUD operations, and maintenance logging.

---

## 📁 Project Structure

```
railway-asset-manager/
├── backend/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── middleware/
│   │   └── auth.js            # JWT protect + role authorize
│   ├── models/
│   │   ├── User.js            # User schema (bcrypt password)
│   │   └── Asset.js           # Asset schema + maintenance logs
│   ├── routes/
│   │   ├── auth.js            # Register, login, user management
│   │   └── assets.js          # CRUD + QR generation + maintenance
│   ├── .env                   # Environment variables (edit this!)
│   ├── package.json
│   └── server.js              # Express app entry point
│
└── frontend/
    ├── css/
    │   └── style.css          # Full design system
    ├── js/
    │   ├── config.js          # API helper, Auth, Toast, Format utils
    │   └── sidebar.js         # Shared sidebar renderer
    ├── pages/
    │   ├── dashboard.html     # Stats + recent assets
    │   ├── assets.html        # Full asset list + CRUD modals
    │   ├── scan.html          # ZXing QR camera scanner
    │   ├── maintenance.html   # Maintenance logs view + add
    │   ├── users.html         # User management (admin only)
    │   └── asset-public.html  # Public asset info (QR scan target)
    └── index.html             # Login / Register page
```

---

## ⚡ Quick Start

### 1. Prerequisites
- **Node.js** v18+ — https://nodejs.org
- **MongoDB** — Either:
  - Local: Install from https://www.mongodb.com/try/download/community
  - Cloud: Free cluster at https://cloud.mongodb.com (MongoDB Atlas)

### 2. Backend Setup

```bash
cd railway-asset-manager/backend
npm install
```

Edit `.env` and set your MongoDB URI:
```env
MONGODB_URI=mongodb://localhost:27017/railway_assets
# OR for Atlas:
# MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/railway_assets

JWT_SECRET=change_this_to_a_long_random_secret_string
PORT=5001
```

Start the backend:
```bash
npm run dev    # with auto-reload (nodemon)
# or
npm start      # production
```

You should see:
```
✅ MongoDB Connected: localhost
🚂 Railway Asset Manager API running on port 5001
```

### 3. Frontend Setup

The frontend is plain HTML/CSS/JS — no build step needed.

**Option A — VS Code Live Server (recommended):**
1. Install the "Live Server" extension in VS Code
2. Right-click `frontend/index.html` → "Open with Live Server"
3. It opens at `http://127.0.0.1:5500`

**Option B — Any static file server:**
```bash
cd railway-asset-manager/frontend
npx serve .     # visit http://localhost:3000
```

### 4. First Login

1. Open the frontend (e.g. `http://127.0.0.1:5500`)
2. Click "Register" tab
3. Create your first account — **the first user automatically becomes Admin**
4. Log in and start adding assets!

---

## 🔐 User Roles

| Role       | Permissions |
|------------|-------------|
| **Admin**  | Full access: create, edit, delete assets; manage users |
| **Inspector** | Create and edit assets; add maintenance logs |
| **Viewer** | Read-only: view assets and maintenance history; scan QR |

---

## 📱 QR Code System

- Every asset gets a unique QR code **automatically on creation**
- QR encodes a URL: `http://localhost:3000/pages/asset-public.html?id=<assetId>`
- The public page shows asset details **without requiring login** — perfect for field staff with a phone
- Download individual QR codes as PNG from the asset detail view
- The **Scan** page uses your device camera (ZXing library) to scan and look up assets instantly

---

## 🛠️ API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET  | `/api/auth/me` | Get current user |
| GET  | `/api/auth/users` | List all users (admin) |
| PATCH | `/api/auth/users/:id` | Update user role/status (admin) |

### Assets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/assets` | List assets (with search/filter/pagination) |
| GET  | `/api/assets/stats` | Dashboard statistics |
| GET  | `/api/assets/:id` | Get single asset (public) |
| POST | `/api/assets` | Create asset + auto-generate QR |
| PUT  | `/api/assets/:id` | Update asset |
| DELETE | `/api/assets/:id` | Delete asset (admin) |
| POST | `/api/assets/:id/maintenance` | Add maintenance log |
| GET  | `/api/assets/:id/qr` | Get QR code image |

---

## 🔧 Configuration Notes

- **CORS**: Backend allows `localhost:3000`, `localhost:5500`, and `127.0.0.1` variants. Add your production URL to `server.js` if deploying.
- **QR URL**: The QR code URL defaults to `http://localhost:3000`. For production, set the `Origin` header or update `generateQR()` in `routes/assets.js`.
- **Rate Limiting**: 200 req/15min general, 20 req/15min for login.
- **JWT**: Tokens expire in 7 days by default (`JWT_EXPIRES_IN` in `.env`).

---

## 📦 Dependencies

### Backend
- `express` — Web framework
- `mongoose` — MongoDB ODM
- `bcryptjs` — Password hashing
- `jsonwebtoken` — JWT authentication
- `qrcode` — QR code generation (server-side, PNG as base64)
- `helmet` — Security headers
- `cors` — Cross-origin requests
- `express-rate-limit` — Rate limiting

### Frontend (CDN, no install needed)
- `zxing-js` — QR code camera scanning

---

## 🚀 Deployment Tips

1. Set `NODE_ENV=production` in `.env`
2. Use MongoDB Atlas for the database
3. Deploy backend to Railway, Render, or Heroku
4. Deploy frontend to Vercel, Netlify, or GitHub Pages
5. Update the CORS origin list in `server.js` with your production frontend URL
6. Update QR code base URL in `routes/assets.js`
