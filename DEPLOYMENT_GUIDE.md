# Deployment Guide - MongoDB Setup

## Why You See "使用本地儲存（MongoDB 未配置）"

This message appears because:
1. **Local Development**: MongoDB serverless functions only work on Vercel, not with `npm run dev`
2. **Expected Behavior**: In development, the app uses localStorage (browser storage)
3. **Production**: Once deployed to Vercel with MongoDB env vars, it will use the database

---

## Two Options for Local Development:

### Option 1: Use Vercel Dev (Recommended)

Run the app with Vercel's development server to test MongoDB locally:

```bash
# Install Vercel CLI globally (if not installed)
npm install -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Pull environment variables from Vercel
vercel env pull .env.local

# Run with Vercel dev server (enables serverless functions)
vercel dev
```

Then open: `http://localhost:3000`

**Benefits:**
- ✅ MongoDB works locally
- ✅ Serverless functions work
- ✅ Identical to production

### Option 2: Use localStorage for Development (Current)

Continue using `npm run dev` and accept localStorage for development:

```bash
npm run dev
```

Then open: `http://localhost:5173`

**Benefits:**
- ✅ Faster development
- ✅ No Vercel CLI needed
- ✅ Works offline

**Limitation:**
- ⚠️ Data not synced to MongoDB
- ⚠️ Use Vercel deployment to test MongoDB

---

## Deploy to Vercel (Production)

### Step 1: Create Vercel Project

1. Go to https://vercel.com
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 2: Add Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables:

Add:
```
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/churchadmin?retryWrites=true&w=majority
```

(Use your actual connection string from MongoDB Atlas)

### Step 3: Deploy

```bash
# From your project directory
vercel --prod
```

Or push to GitHub (if connected to Vercel):
```bash
git push
```

Vercel will automatically deploy!

---

## Verify MongoDB is Working in Production

After deployment:

1. Open your Vercel deployment URL
2. Log in with: `admin@church.com` / `demo123`
3. Go to "Classes & Activities"
4. **The warning message should be GONE**
5. Try creating a class arrangement
6. Check MongoDB Atlas → Database → Collections → You should see `arrangements` collection created!

---

## Current Status

| Environment | MongoDB | Storage |
|-------------|---------|---------|
| Local (`npm run dev`) | ❌ Not available | localStorage |
| Local (`vercel dev`) | ✅ Available | MongoDB |
| Vercel Production | ✅ Available | MongoDB |

---

## Quick Deploy Commands

```bash
# Deploy to Vercel
vercel --prod

# Or if you have auto-deploy from GitHub
git add .
git commit -m "Deploy to Vercel"
git push
```

---

## Troubleshooting

### "使用本地儲存" message won't go away

**On Local Development:**
- This is normal! Use `vercel dev` instead of `npm run dev` to enable MongoDB

**On Vercel Production:**
1. Check environment variables are set in Vercel Dashboard
2. Verify MONGODB_URI is correct
3. Check MongoDB Atlas Network Access includes Vercel IPs (use 0.0.0.0/0)
4. Redeploy: `vercel --prod`

### MongoDB connection fails on Vercel

1. **Check Network Access** in MongoDB Atlas:
   - Go to Network Access
   - Add `0.0.0.0/0` (Allow from anywhere)

2. **Verify connection string** in Vercel:
   - Must include `/churchadmin` database name
   - Password must be URL-encoded if it has special characters

3. **Check Vercel logs**:
   ```bash
   vercel logs
   ```

---

## Next Steps

1. ✅ You've set up MongoDB Atlas
2. ✅ You've created demo users
3. ⏭️ **Deploy to Vercel** to make MongoDB work in production
4. ⏭️ Or use `vercel dev` to test MongoDB locally

Choose your preferred development workflow and follow the steps above!
