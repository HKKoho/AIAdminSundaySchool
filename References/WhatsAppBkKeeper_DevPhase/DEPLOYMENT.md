# Deployment Guide

## Architecture

This application consists of two parts:
1. **Frontend** (React + Vite) - Can be deployed to Vercel
2. **Backend** (Express.js + WhatsApp Web.js) - Requires a persistent server

## Frontend Deployment (Vercel)

The frontend is deployed to Vercel and configured in `vercel.json`.

### Deploy to Vercel

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Deploy
vercel

# For production
vercel --prod
```

### Environment Variables

Set in Vercel Dashboard (vercel.com):
- `VITE_API_URL` - URL of your backend server (e.g., `https://your-backend.railway.app`)

## Backend Deployment

**IMPORTANT**: The backend uses WhatsApp Web.js which requires:
- Persistent file system (for session data)
- Long-running process (WebSocket connection)
- NOT compatible with Vercel's serverless functions

### Recommended Backend Hosting Options

1. **Railway.app** (Recommended)
   - Easy deployment from GitHub
   - Persistent storage
   - Supports WebSocket connections

2. **Render.com**
   - Free tier available
   - Persistent disk storage

3. **Heroku**
   - Reliable and well-documented

4. **DigitalOcean App Platform**
   - More control over infrastructure

### Backend Environment Variables

Required for backend deployment:
- `GEMINI_API_KEY` - Google Gemini API key
- `OPENAI_API_KEY` - OpenAI API key
- `PORT` - Server port (default: 3004)

### Deploy Backend to Railway (Example)

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select `aibymlMelissa/WhatsAppBkKeeper_DevPhase`
4. Configure:
   - **Root Directory**: `/`
   - **Start Command**: `npm run server`
   - **Environment Variables**: Add GEMINI_API_KEY, OPENAI_API_KEY
5. Deploy
6. Copy the generated URL
7. Update Vercel environment variable `VITE_API_URL` with Railway URL

## Local Development

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your API keys

# Run both frontend and backend
npm start

# Or run separately:
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run dev
```

## CORS Configuration

The backend is configured to accept requests from:
- `http://localhost:5173` (local development)
- Your Vercel domain (add to server/index.js)

Update `server/index.js` CORS configuration after deployment:

```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://your-app.vercel.app'  // Add your Vercel domain
  ]
}));
```

## Post-Deployment Checklist

- [ ] Backend deployed and running
- [ ] Environment variables configured on backend
- [ ] Backend URL added to Vercel as `VITE_API_URL`
- [ ] Frontend deployed to Vercel
- [ ] CORS configured to allow Vercel domain
- [ ] WhatsApp QR code authentication working
- [ ] Document upload and classification working
- [ ] Instructions processing working
