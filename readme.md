# GemChat

GemChat is a full-stack collaborative coding workspace with:

- project chat with persistent messages
- persistent file tree stored in MongoDB
- AI-assisted chat and code generation
- Monaco editor, live collaboration, and WebContainer preview

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express + Socket.IO
- Database: MongoDB + Mongoose
- AI: Google Gemini

## Project Structure

```text
SOEN/
├─ BACKEND/
├─ FrontEnd/
├─ package.json
└─ readme.md
```

## Environment Variables

Backend: create `BACKEND/.env`

```env
PORT=3000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/gemchat
JWT_SECRET=replace_with_a_long_random_secret
GOOGLE_API_KEY=your_google_gemini_api_key
CLIENT_URL=http://localhost:5173
TRUST_PROXY=false
```

Frontend: create `FrontEnd/.env`

```env
VITE_API_URL=http://localhost:3000
```

Templates are included in:

- `BACKEND/.env.example`
- `FrontEnd/.env.example`

## Local Development

Install everything:

```bash
npm run install:all
```

Run backend:

```bash
npm run dev:backend
```

Run frontend:

```bash
npm run dev:frontend
```

Frontend:

```text
http://localhost:5173
```

Backend health check:

```text
http://localhost:3000/health
```

## Production Build

Build frontend:

```bash
npm run build
```

Run backend in production:

```bash
npm run start
```

## Deployment

Recommended setup:

1. Deploy `BACKEND` to Render, Railway, or a VPS.
2. Deploy `FrontEnd` to Vercel or Netlify.
3. Point frontend `VITE_API_URL` to the deployed backend URL.
4. Set backend `CLIENT_URL` to the deployed frontend URL.

Included deploy config files:

- `render.yaml` for Render blueprint deploy
- `FrontEnd/vercel.json` for Vercel
- `FrontEnd/netlify.toml` for Netlify

### Backend Deployment Steps

Use `BACKEND` as the service root.

Build command:

```bash
npm install
```

Start command:

```bash
npm start
```

Required backend env vars:

- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `GOOGLE_API_KEY`
- `CLIENT_URL`
- `TRUST_PROXY=true` on Render/Railway/reverse-proxy platforms

After deploy, verify:

- `GET /health` returns `200`
- Socket connection works from the frontend
- MongoDB allows connections from your backend host

### One-Click Render Deploy

This repo now includes `render.yaml`.

Steps:

1. Push the repo to GitHub.
2. In Render, choose `New +` → `Blueprint`.
3. Select your GitHub repo.
4. Render will detect `render.yaml` and create:
   - `gemchat-backend`
   - `gemchat-frontend`
5. Fill in the unsynced env vars:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `GOOGLE_API_KEY`
   - `CLIENT_URL`
   - `VITE_API_URL`
6. Set:
   - backend `CLIENT_URL` = frontend Render URL
   - frontend `VITE_API_URL` = backend Render URL
7. Deploy both services.

### Frontend Deployment Steps

Use `FrontEnd` as the project root.

Build command:

```bash
npm install && npm run build
```

Output directory:

```text
dist
```

Required frontend env vars:

- `VITE_API_URL=https://your-backend-domain.com`

`FrontEnd/vercel.json` already contains SPA rewrites and the required COOP/COEP headers for WebContainer support.

### Netlify Frontend Deploy

`FrontEnd/netlify.toml` is included.

Use:

- Base directory: `FrontEnd`
- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Env var: `VITE_API_URL=https://your-backend-domain.com`

## Deploy Checklist

- Create MongoDB Atlas database
- Add backend environment variables
- Add frontend environment variables
- Set backend `CLIENT_URL` to the exact frontend domain
- Set frontend `VITE_API_URL` to the exact backend domain
- Enable `TRUST_PROXY=true` if backend is behind Render/Railway/Nginx
- Test `/health`
- Open one project and verify:
  - files persist after refresh
  - chat persists after refresh
  - AI replies work
  - React preview loads

## Notes

- File contents and chat messages are persisted in MongoDB.
- Backend now exposes `/health` for deployment checks.
- For best production stability, use Node 18+.
