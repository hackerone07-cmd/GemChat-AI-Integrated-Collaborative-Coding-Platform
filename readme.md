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

If you are running the app through `docker compose`, use:

```env
VITE_API_URL=http://localhost:4000
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

## Docker Hub Publishing

This repo includes a GitHub Actions workflow in `.github/workflows/ci.yml` that builds and pushes Docker images only. It does not deploy the app anywhere.

Images published by the workflow:

- `hackerone07/gemchat-backend`
- `hackerone07/gemchat-frontend`

The workflow tags each image as:

- `latest`
- the current Git commit SHA

To enable the push, add these GitHub repository secrets:

- `DOCKERHUB_USERNAME` = `hackerone07`
- `DOCKERHUB_TOKEN` = your Docker Hub password or access token

The workflow runs on pushes to `main` and can also be started manually from GitHub Actions.

The frontend image is built with `VITE_API_URL` at build time. If you need to point it at a real backend, pass that value when building or set the matching GitHub variable before the workflow runs.

## Notes

- File contents and chat messages are persisted in MongoDB.
- Backend now exposes `/health` for deployment checks.
- For best production stability, use Node 18+.
