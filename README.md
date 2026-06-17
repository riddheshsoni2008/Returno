# Returno Monorepo

A clean, production-ready monorepo structure for the Returno platform.

## Project Structure

```
project-root/
├── frontend/             # Next.js (Frontend)
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── next.config.mjs
│   └── .env.local
│
├── backend/              # Node.js + Express (Backend)
│   ├── src/              # Source directory containing MVC modules
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── services/
│   │   ├── config/
│   │   └── utils/
│   ├── package.json
│   ├── server.js
│   └── .env
│
├── .gitignore
├── README.md
└── package.json
```

## Environment Variables

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Backend (`backend/.env`)
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/returno
JWT_SECRET=returno-enterprise-secure-jwt-key-2026
EMAIL_USER=ns3401976@gmail.com
EMAIL_PASSWORD=ohhw kxja dhbb ifnn
```

## Running Locally

From the root directory, you can run the following commands:

- Run frontend in development mode: `npm run dev:frontend`
- Run backend in development mode: `npm run dev:backend`
- Build frontend: `npm run build:frontend`

Or run them individually in their respective directories:

### Frontend
```bash
cd frontend
npm run dev
```

### Backend
```bash
cd backend
npm run dev
```

## Deployment

### Frontend (Vercel)
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: Handled automatically by Next.js
- **Environment Variables**: Make sure to set `NEXT_PUBLIC_API_URL` pointing to your deployed backend URL.

### Backend (Railway/Render)
- **Root Directory**: `backend`
- **Start Command**: `npm start`
- **Environment Variables**: Configure `PORT`, `MONGODB_URI`, `JWT_SECRET`, `EMAIL_USER`, and `EMAIL_PASSWORD`.
