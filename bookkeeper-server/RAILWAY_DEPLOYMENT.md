# Deploy WhatsApp Bookkeeper to Railway

Complete guide to deploy the WhatsApp Bookkeeper server to Railway for a fully cloud-based solution.

## Why Railway?

- ✅ Always-on server (not serverless)
- ✅ Persistent storage for WhatsApp session
- ✅ Free $5/month credit
- ✅ Auto-deploy from GitHub
- ✅ Easy environment variable management

## Prerequisites

1. GitHub account (you already have this)
2. Railway account - Sign up at https://railway.app
3. Gemini API key

## Step-by-Step Deployment

### 1. Create Railway Account

1. Go to https://railway.app
2. Click "Sign in with GitHub"
3. Authorize Railway to access your GitHub

### 2. Create New Project

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your repository: `AIAdminSundaySchool`
4. Railway will detect the repository

### 3. Configure Root Directory

Since the bookkeeper server is in a subdirectory:

1. After selecting the repo, click on the service
2. Go to **Settings** tab
3. Scroll to **Source**
4. Set **Root Directory**: `bookkeeper-server`
5. Click **Save**

### 4. Add Environment Variables

1. Go to **Variables** tab
2. Click "New Variable"
3. Add these variables:

```
PORT=3002
GEMINI_API_KEY=your_gemini_api_key_here
VITE_API_KEY=your_gemini_api_key_here
```

**Important:** Use your actual Gemini API key from:
https://aistudio.google.com/app/apikey

### 5. Enable Volume for WhatsApp Session (Important!)

1. Go to **Settings** tab
2. Scroll to **Volumes**
3. Click "Add Volume"
4. **Mount Path**: `/app/whatsapp-session`
5. This ensures WhatsApp stays logged in after restarts

### 6. Deploy

1. Railway automatically builds and deploys
2. Wait 2-3 minutes for build to complete
3. You'll see "Deployed" status when ready

### 7. Get Your Railway URL

1. Go to **Settings** tab
2. Under **Networking**, you'll see your Railway domain
3. Example: `https://your-app.railway.app`
4. Copy this URL - you'll need it for the frontend

### 8. Update Frontend Environment Variable

On Vercel, add environment variable:

1. Go to your Vercel project
2. Settings → Environment Variables
3. Add: `VITE_BOOKKEEPER_API_URL`
4. Value: `https://your-railway-url.railway.app`
5. Redeploy Vercel

### 9. Test the Deployment

1. Visit your Vercel app: https://ai-admin-sunday-school-....vercel.app
2. Go to AI Bookkeeper
3. You should see QR code appear (wait 10-20 seconds for Railway to initialize)
4. Scan with WhatsApp
5. Send a receipt/invoice to test!

## Environment Variables Explained

| Variable | Purpose | Where to Get |
|----------|---------|--------------|
| `PORT` | Railway auto-assigns, but we specify 3002 for consistency | Use `3002` |
| `GEMINI_API_KEY` | For AI document classification | https://aistudio.google.com/app/apikey |
| `VITE_API_KEY` | Alternative variable name (same as GEMINI_API_KEY) | Same as above |

## Troubleshooting

### Build Fails

**Error:** "Cannot find module 'whatsapp-web.js'"
- **Fix:** Make sure `Root Directory` is set to `bookkeeper-server`

**Error:** "Chromium not found"
- **Fix:** nixpacks.toml should include chromium (already configured)

### QR Code Not Appearing

1. Check Railway logs: Click on deployment → View Logs
2. Look for "QR Code received"
3. If not appearing after 30 seconds, restart the deployment

### WhatsApp Disconnects After Restart

**Problem:** Session not persisting
**Fix:** Make sure Volume is configured (Step 5)

### CORS Errors

**Problem:** Frontend can't connect to Railway
**Fix:** The server already has CORS enabled for all origins

## Railway Free Tier Limits

- **$5 credit per month** (enough for one small server)
- Sleeps after 30 minutes of inactivity (will wake up automatically)
- If you need 24/7 uptime without sleep, upgrade to Hobby plan ($5/month)

## Monitoring

### View Logs
1. Go to your Railway project
2. Click on the deployment
3. View real-time logs

### Restart Server
1. Go to **Deployments** tab
2. Click on latest deployment
3. Click "Restart" if needed

## Cost Estimate

- **Free tier:** $5/month credit (sufficient for testing)
- **Hobby plan:** $5/month (if you exceed free tier)
- WhatsApp session storage: Included
- Bandwidth: Usually within free tier

## Next Steps After Deployment

1. ✅ Railway server running
2. ✅ WhatsApp QR code appears on Vercel site
3. ✅ Scan QR code with WhatsApp
4. ✅ Send receipts/invoices via WhatsApp
5. ✅ AI automatically classifies documents
6. 🚀 Fully cloud-based system!

## Alternative: Render Deployment

If you prefer Render over Railway:

1. Go to https://render.com
2. Create new "Web Service"
3. Connect GitHub repo
4. Set Root Directory: `bookkeeper-server`
5. Build Command: `npm install`
6. Start Command: `node server.js`
7. Add environment variables
8. Deploy!

## Support

If you encounter issues:
- Check Railway logs
- Verify environment variables
- Ensure Volume is configured
- Test locally first with `npm start`
