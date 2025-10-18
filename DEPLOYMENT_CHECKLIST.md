# Deployment Checklist for Sunday School Admin

## ✅ Pre-Deployment Setup

### 1. MongoDB Atlas Setup
- [ ] Create MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
- [ ] Create a FREE M0 cluster
- [ ] Create database user with read/write permissions
- [ ] Whitelist IP addresses (allow from anywhere for Vercel)
- [ ] Get connection string
- [ ] Test connection locally

### 2. Environment Variables

#### Local (.env.local)
```env
VITE_API_KEY=your_gemini_api_key_here
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sundayschool?retryWrites=true&w=majority
```

#### Vercel Dashboard
- [ ] Add `VITE_API_KEY` environment variable
- [ ] Add `MONGODB_URI` environment variable
- [ ] Apply to Production, Preview, and Development

### 3. Code Verification
- [x] All TypeScript errors resolved
- [x] Build succeeds (`npm run build`)
- [x] Development server runs without errors
- [x] Export/Import functionality implemented
- [x] MongoDB integration complete

## 🚀 Deployment Steps

### Option 1: Deploy via Vercel Dashboard

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Add MongoDB integration and export/import features"
   git push origin main
   ```

2. **Import to Vercel:**
   - Go to https://vercel.com/new
   - Select your repository
   - Vercel auto-detects Vite configuration
   - Click "Deploy"

3. **Configure Environment Variables:**
   - Go to Project Settings → Environment Variables
   - Add `VITE_API_KEY` and `MONGODB_URI`
   - Save changes

4. **Redeploy:**
   - Go to Deployments
   - Click "Redeploy" on the latest deployment

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Add environment variables
vercel env add VITE_API_KEY
vercel env add MONGODB_URI

# Deploy to production
vercel --prod
```

## 🧪 Post-Deployment Testing

### Test Checklist
- [ ] App loads successfully
- [ ] Landing page displays correctly
- [ ] Can navigate to "課程" (Classes) section
- [ ] Can enter management mode with password: `cklbckoho`
- [ ] Can create new class arrangement
- [ ] Data persists after page reload
- [ ] Can edit existing arrangement
- [ ] Can delete arrangement
- [ ] Export functionality downloads JSON file
- [ ] Import functionality uploads JSON file
- [ ] AI features work (Teacher Support section)

### Test URLs
- **Landing Page:** `https://your-app.vercel.app/`
- **API Endpoint:** `https://your-app.vercel.app/api`

## 🔍 Troubleshooting

### Build Fails
1. Check Vercel deployment logs
2. Verify all dependencies are in `package.json`
3. Ensure Node.js version compatibility

### API Errors
1. Check environment variables are set correctly
2. Verify MongoDB connection string format
3. Check Vercel function logs

### Database Connection Issues
1. Verify IP whitelist in MongoDB Atlas
2. Check database user permissions
3. Test connection string locally first

### Data Not Persisting
1. Check browser console for errors
2. Verify API endpoint is accessible
3. Check MongoDB Atlas cluster is running

## 📊 Monitoring

### Things to Monitor
- Vercel deployment status
- MongoDB Atlas metrics (connections, operations)
- API response times
- Error rates in Vercel logs

### MongoDB Atlas Dashboard
- Monitor database size
- Check connection count
- Review slow queries

## 🔐 Security Considerations

- [x] `.env.local` is in `.gitignore`
- [x] API endpoints use proper error handling
- [x] Management features are password protected
- [ ] Consider adding rate limiting for API endpoints
- [ ] Regularly rotate API keys and database passwords

## 📝 Maintenance

### Regular Tasks
- Weekly: Check Vercel deployment logs for errors
- Monthly: Review MongoDB Atlas metrics
- Quarterly: Update dependencies (`npm update`)
- As needed: Export data backups

### Backup Strategy
1. Use "匯出" (Export) button to download JSON backups
2. Store backups in a secure location
3. Test restore process periodically

## 🎯 Success Criteria

Your deployment is successful when:
- ✅ All pages load without errors
- ✅ Data persists in MongoDB Atlas
- ✅ Export/Import features work correctly
- ✅ AI features generate content
- ✅ No console errors in production
- ✅ Mobile responsive design works

## 📞 Support Resources

- **MongoDB Atlas Docs:** https://docs.atlas.mongodb.com/
- **Vercel Docs:** https://vercel.com/docs
- **Vite Docs:** https://vitejs.dev/
- **Tailwind CSS v4 Docs:** https://tailwindcss.com/

## 🎉 Next Steps After Deployment

1. Share the app URL with your team
2. Import any existing class arrangements
3. Set up regular data backups
4. Monitor usage and performance
5. Gather user feedback for improvements

---

**Deployment Date:** _____________

**Deployed URL:** _____________

**MongoDB Cluster:** _____________

**Notes:**
