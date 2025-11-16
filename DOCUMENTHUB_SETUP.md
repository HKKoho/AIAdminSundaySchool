# Document Hub with Synology NAS Integration - Setup Guide

This guide will help you set up the Document Hub feature with your Synology NAS for file storage.

## Architecture Overview

```
┌─────────────────┐
│  React App      │  (Vercel/Cloud)
│  (Frontend)     │
└────────┬────────┘
         │
         ├──────────────┐
         │              │
         ▼              ▼
┌─────────────────┐  ┌──────────────────┐
│  Vercel API     │  │  Bridge Server   │  (Local Network)
│  (Metadata)     │  │  (File Ops)      │
└────────┬────────┘  └────────┬─────────┘
         │                    │
         ▼                    ▼
    ┌─────────┐         ┌───────────────┐
    │ MongoDB │         │ Synology NAS  │
    │ (Cloud) │         │ (SMB Share)   │
    └─────────┘         └───────────────┘
```

**What goes where:**
- **MongoDB (Cloud)**: Document metadata (title, department, year, status, etc.)
- **Synology NAS (Local)**: Actual files (PDF, Word, Excel, etc.)
- **Vercel API**: Handles metadata operations (search, filter, user auth)
- **Bridge Server**: Handles file upload/download to NAS via SMB

## Prerequisites

- [ ] Synology NAS with SMB enabled
- [ ] MongoDB Atlas account (free tier works)
- [ ] Node.js 20+ installed locally
- [ ] Vercel account (for deployment)

## Part 1: Synology NAS Setup

### Step 1: Enable SMB File Sharing

1. Log into your Synology DSM
2. Go to **Control Panel** → **File Services**
3. Click the **SMB** tab
4. Check **Enable SMB service**
5. Click **Apply**

### Step 2: Create Document Share

1. Go to **Control Panel** → **Shared Folder**
2. Click **Create** → **Create Shared Folder**
3. Name it `documents` (or your preferred name)
4. Set location to your preferred volume
5. Click **Next** and configure permissions:
   - Add your user account with **Read/Write** permission
6. Click **Apply**

### Step 3: Note Your NAS Details

You'll need these later:
- **NAS IP Address**: Find in **Control Panel** → **Network** → **Network Interface**
  - Example: `192.168.1.100`
- **Share Name**: The name you just created (e.g., `documents`)
- **Username**: Your DSM username
- **Password**: Your DSM password

## Part 2: MongoDB Setup

### Step 1: Create MongoDB Atlas Account

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Sign up for free account
3. Create a new cluster (free tier is fine)

### Step 2: Configure Database Access

1. Go to **Database Access**
2. Click **Add New Database User**
3. Create username and password
4. **IMPORTANT**: Save these credentials

### Step 3: Configure Network Access

1. Go to **Network Access**
2. Click **Add IP Address**
3. For development: Click **Allow Access from Anywhere**
4. For production: Add your Vercel deployment IPs

### Step 4: Get Connection String

1. Go to **Database** → **Connect**
2. Choose **Connect your application**
3. Copy the connection string
4. Replace `<password>` with your actual password
5. Save this string - you'll need it for `.env`

## Part 3: Bridge Server Setup

### Step 1: Navigate to Bridge Server Directory

```bash
cd bridge-server
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` with your NAS details:
```env
# Bridge Server Configuration
BRIDGE_PORT=3001

# Synology NAS Configuration
NAS_HOST=192.168.1.100          # Your NAS IP from Part 1
NAS_SHARE=documents             # Your share name from Part 1
NAS_USERNAME=your-nas-username  # Your DSM username
NAS_PASSWORD=your-nas-password  # Your DSM password
NAS_DOMAIN=WORKGROUP            # Usually WORKGROUP
NAS_BASE_PATH=/DocumentHub      # Base folder in share
```

### Step 4: Test the Bridge Server

1. Start the server:
```bash
npm run dev
```

2. You should see:
```
🚀 Bridge Server running on http://localhost:3001
📁 NAS Config: your-username@192.168.1.100/documents/DocumentHub
💡 Make sure your Synology NAS is accessible on your network
```

3. Test the health endpoint in your browser:
```
http://localhost:3001/health
```

You should see:
```json
{
  "success": true,
  "status": "running",
  "nas": {
    "host": "192.168.1.100",
    "share": "documents",
    "basePath": "/DocumentHub"
  }
}
```

### Step 5: Keep Bridge Server Running

The bridge server needs to run whenever you want to upload/download files. Options:

**Option A - Manual** (for testing):
```bash
npm run dev
```

**Option B - Background Service** (recommended):
See `bridge-server/README.md` for instructions on running as a systemd service (Linux) or launchd (macOS)

**Option C - Run on Synology** (advanced):
Deploy as Docker container on your NAS - see bridge-server/README.md

## Part 4: Main Application Setup

### Step 1: Configure Environment Variables

1. Copy `.env.example` to `.env`:
```bash
cd ..  # Back to project root
cp .env.example .env
```

2. Edit `.env` and add your MongoDB connection string:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/church-admin?retryWrites=true&w=majority
```

3. Verify Document Hub configuration:
```env
VITE_API_URL=/api/documenthub
VITE_BRIDGE_URL=http://localhost:3001
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Run Development Server

```bash
npm run dev
```

The app will start at `http://localhost:3000`

## Part 5: Testing the Integration

### Step 1: Access Document Hub

1. Open `http://localhost:3000`
2. Click on the **Document Hub** card
3. Log in with a demo account:
   - Role: Any role (e.g., "Pastoral")
   - Password: `pastoral123`

### Step 2: Test File Upload

1. Click **▼ Upload New Document**
2. Fill in the form:
   - Document Title: "Test Document"
   - Select a file from your computer
   - Choose department, ministry, type, year, status
3. Click **Upload Document**

### Step 3: Verify Upload

**Check the frontend:**
- Document should appear in the list

**Check MongoDB:**
- Go to MongoDB Atlas → Browse Collections
- You should see metadata in the `documents` collection

**Check Synology NAS:**
- Open File Station on your NAS
- Navigate to `documents/DocumentHub/`
- You should see folder structure: `{year}/{department}/{docType}/filename.pdf`

### Step 4: Test Download

1. Find your uploaded document in the list
2. Click on it (when download feature is added)
3. File should download to your computer

## Part 6: Production Deployment

### Step 1: Deploy to Vercel

```bash
vercel
```

Or connect your GitHub repo to Vercel for automatic deployments.

### Step 2: Add Environment Variables in Vercel

1. Go to your project on Vercel dashboard
2. Settings → Environment Variables
3. Add:
   - `MONGODB_URI`: Your MongoDB connection string
   - `VITE_API_URL`: `/api/documenthub`
   - `VITE_BRIDGE_URL`: `http://your-bridge-server-ip:3001`

**IMPORTANT**: For `VITE_BRIDGE_URL` in production, you need either:
- A static IP for your bridge server
- A domain name pointing to your bridge server
- VPN/tunnel solution (like Tailscale, ngrok)

### Step 3: Bridge Server for Production

For production, your bridge server needs to be:
- Always running
- Accessible from the internet (if Vercel needs to reach it)
- Secured with HTTPS/authentication

**Recommended Setup:**
1. Run bridge server on your Synology NAS via Docker
2. Use Tailscale/ZeroTier for secure network access
3. Or use Synology's QuickConnect with port forwarding

## Troubleshooting

### Bridge Server Can't Connect to NAS

**Problem:** Mount errors or "connection refused"

**Solutions:**
1. Verify NAS IP is correct: `ping 192.168.1.100`
2. Check SMB is enabled on Synology
3. Verify credentials are correct
4. Check firewall isn't blocking SMB (port 445)

### Files Not Appearing on NAS

**Problem:** Upload succeeds but file not on NAS

**Solutions:**
1. Check NAS permissions - user must have write access
2. Verify share path is correct
3. Check bridge server logs for errors
4. Manually create `/DocumentHub` folder in your share

### MongoDB Connection Errors

**Problem:** "Failed to connect to MongoDB"

**Solutions:**
1. Verify connection string is correct
2. Check password doesn't have special characters that need URL encoding
3. Verify network access allows your IP in MongoDB Atlas
4. Check if MongoDB cluster is paused (Atlas free tier)

### Bridge Server Not Accessible from Frontend

**Problem:** "Bridge server not accessible"

**Solutions:**
1. Verify bridge server is running: `http://localhost:3001/health`
2. Check `VITE_BRIDGE_URL` in `.env` is correct
3. Restart dev server after changing `.env`
4. Check browser console for CORS errors

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use strong passwords** for NAS and MongoDB
3. **Limit MongoDB network access** to specific IPs in production
4. **Use HTTPS** for production bridge server
5. **Add authentication** to bridge server API endpoints
6. **Regular backups** of MongoDB and NAS data
7. **Monitor access logs** on both NAS and MongoDB

## Next Steps

After successfully setting up:

1. **Add User Management**: Implement proper authentication beyond demo passwords
2. **Add File Preview**: PDF viewer, image preview, etc.
3. **Add Versioning**: Track document versions
4. **Add Permissions**: Role-based access control
5. **Add Audit Logs**: Track who uploaded/downloaded what
6. **Add Bulk Operations**: Upload multiple files at once
7. **Add Full-Text Search**: Index document contents
8. **Add Notifications**: Email alerts for new documents

## Support

If you encounter issues:

1. Check bridge server logs
2. Check browser console for errors
3. Check MongoDB Atlas logs
4. Check Synology NAS logs in **Log Center**

## Architecture Benefits

This hybrid architecture gives you:

✅ **Cloud benefits**: Deployed on Vercel, globally accessible
✅ **Local storage**: Files stay on your NAS, not in cloud
✅ **Fast metadata**: MongoDB for quick searches/filters
✅ **Organized files**: Automatic folder structure on NAS
✅ **Secure**: Files don't leave your network unnecessarily
✅ **Cost-effective**: No cloud storage fees

## File Organization on NAS

Files are automatically organized as:
```
/documents/DocumentHub/
├── 2024/
│   ├── Executive Committee/
│   │   ├── Meeting Minutes/
│   │   │   └── EC-Minutes-Jan-2024.pdf
│   │   └── Annual Plan/
│   │       └── EC-Plan-2024.pdf
│   └── Pastoral Department (Adult Zone)/
│       └── Budget Report/
│           └── Adult-Budget-Q1.xlsx
└── 2023/
    └── ...
```

This structure makes files:
- Easy to find manually
- Easy to backup
- Easy to migrate
- Searchable via File Station
