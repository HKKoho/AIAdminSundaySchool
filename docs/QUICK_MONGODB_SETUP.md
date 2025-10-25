# Quick MongoDB Setup (5 Minutes)

## Why Set Up MongoDB?

✅ Cloud backup of your data
✅ Access from any device
✅ Share with team members
✅ Data persists even if browser cache cleared
✅ Professional production setup

## Quick Setup Steps

### 1. Create MongoDB Atlas Account (2 minutes)

1. **Go to:** https://www.mongodb.com/cloud/atlas
2. **Click:** "Try Free"
3. **Sign up** with Google or email

### 2. Create Free Cluster (1 minute)

1. Choose **M0 (FREE)** tier
2. Select region closest to you (e.g., AWS Singapore for Asia)
3. Click **"Create"**
4. Wait ~3 minutes for cluster creation

### 3. Create Database User (1 minute)

1. Click **"Database Access"** in left menu
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Username: `sundayschool`
5. **Auto-generate** a secure password
6. **COPY THE PASSWORD** - you'll need it!
7. Select: **"Read and write to any database"**
8. Click **"Add User"**

### 4. Allow Access (30 seconds)

1. Click **"Network Access"** in left menu
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"**
4. Click **"Confirm"**

### 5. Get Connection String (30 seconds)

1. Click **"Database"** in left menu
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Copy the connection string:
   ```
   mongodb+srv://sundayschool:<password>@cluster.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with the password you copied in Step 3
6. Add database name at the end:
   ```
   mongodb+srv://sundayschool:YOUR_PASSWORD@cluster.mongodb.net/sundayschool?retryWrites=true&w=majority
   ```

### 6. Add to Vercel (1 minute)

#### For Vercel Deployment:

1. Go to your project on **Vercel Dashboard**
2. Click **"Settings"** → **"Environment Variables"**
3. Add:
   - Name: `MONGODB_URI`
   - Value: Your connection string from Step 5
4. Click **"Save"**
5. **Redeploy** your project

#### For Local Development:

Update your `.env.local` file:

```env
VITE_API_KEY=AIzaSyD8_c1dIOL85wlRHCnJnKDnrka1UhBd5Xo
MONGODB_URI=mongodb+srv://sundayschool:YOUR_PASSWORD@cluster.mongodb.net/sundayschool?retryWrites=true&w=majority
```

### 7. Test It Works

1. **Reload your app**
2. The yellow warning should **disappear**
3. Data now saves to MongoDB!

## Migrate Existing Data (Optional)

If you already have classes in localStorage:

1. **Before MongoDB setup:**
   - Click "匯出" (Export) to save JSON file

2. **After MongoDB setup:**
   - Reload the app
   - Click "匯入" (Import)
   - Select your exported JSON file

## Verify MongoDB is Working

### Good Signs:
- ✅ Yellow warning banner **gone**
- ✅ No errors in browser console
- ✅ Classes persist after clearing browser cache
- ✅ Same data visible on different devices

### Check MongoDB Data:

1. Go to MongoDB Atlas
2. Click **"Browse Collections"**
3. You should see:
   - Database: `sundayschool`
   - Collection: `arrangements`
   - 7 documents (your classes)

## Troubleshooting

### Warning still shows?

**Clear the fallback flag:**
```javascript
// Open browser console (F12)
localStorage.setItem('useMongoDBStorage', 'true');
location.reload();
```

### Connection errors?

**Check:**
1. Password is correct (no < > brackets)
2. IP is whitelisted (allow from anywhere)
3. Database name is `sundayschool`
4. Connection string format is correct

### Data not showing?

**Import default data:**
1. Click "管理課程" (password: `cklbckoho`)
2. Click "匯入" (Import)
3. Select `default-arrangements.json`

## Cost

- **MongoDB Atlas M0:** FREE forever
- **500 MB storage:** More than enough for years of data
- **No credit card required**

## Need More Help?

See the full guide: `MONGODB_SETUP.md`

---

**Estimated Total Time:** 5-7 minutes
**Difficulty:** Easy ⭐
**Result:** Professional cloud database setup! 🎉
