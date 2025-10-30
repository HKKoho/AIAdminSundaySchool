# MongoDB Atlas Setup Guide for Sunday School Admin

This guide will help you set up MongoDB Atlas and connect it to your Sunday School Admin application on Vercel.

## Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click "Try Free" or "Sign In" if you already have an account
3. Sign up with your email or Google account

## Step 2: Create a New Cluster

1. After logging in, click "Build a Database"
2. Choose the **FREE** tier (M0 Sandbox)
3. Select a cloud provider and region (choose one closest to your users)
4. Give your cluster a name (e.g., "Admin_SundaySchool_cklbc")
5. Click "Create"

## Step 3: Create a Database User

1. Click on "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Enter a username (e.g., `sundayschool`)
5. **Generate a secure password** and save it somewhere safe
6. Under "Database User Privileges", select "Read and write to any database"
7. Click "Add User"

## Step 4: Whitelist IP Addresses

1. Click on "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (this allows Vercel to connect)
   - Note: For production, you can whitelist specific Vercel IPs for better security
4. Click "Confirm"

## Step 5: Get Your Connection String

1. Go back to "Database" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select "Driver: Node.js" and "Version: 5.5 or later"
5. Copy the connection string, it looks like:
   ```
   mongodb+srv://username:<password>@cluster.mongodb.net/?retryWrites=true&w=majority
   ```
6. **Replace `<password>` with your actual database user password**
7. Change the database name in the URL:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/sundayschool?retryWrites=true&w=majority
   ```

## Step 6: Configure Environment Variables in Vercel

### Local Development (.env.local)

Create or update your `.env.local` file:

```env
VITE_API_KEY=your_gemini_api_key_here
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sundayschool?retryWrites=true&w=majority
```

### Vercel Production

1. Go to your project on [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project
3. Go to "Settings" → "Environment Variables"
4. Add the following variables:

   | Name | Value |
   |------|-------|
   | `VITE_API_KEY` | Your Gemini API key |
   | `MONGODB_URI` | Your MongoDB connection string |

5. Make sure to select all environments (Production, Preview, Development)
6. Click "Save"

## Step 7: Deploy to Vercel

1. Push your code to GitHub
2. Import your repository to Vercel
3. Vercel will automatically detect it's a Vite project
4. Click "Deploy"

## Step 8: Test Your Application

1. Once deployed, visit your Vercel URL
2. Go to the "課程" (Classes) section
3. Click "管理課程" (Manage Classes) and enter the password: `cklbckoho`
4. Try adding a new class arrangement
5. The data should now be saved to MongoDB Atlas!

## Features Available

### Export Data
- Click "匯出" (Export) to download all arrangements as a JSON file
- This creates a backup of your data

### Import Data
- Click "匯入" (Import) to upload a JSON file
- Useful for restoring backups or migrating data

## Troubleshooting

### Connection Errors
- Verify your MongoDB connection string is correct
- Check that your IP is whitelisted in Network Access
- Ensure your database user password is correct

### Data Not Saving
- Check Vercel deployment logs for errors
- Verify environment variables are set correctly
- Make sure the database name in your connection string matches

### API Errors
- Check the browser console for detailed error messages
- Verify the API endpoint is accessible at `/api`

## Security Best Practices

1. **Never commit `.env.local` to Git** - it's already in `.gitignore`
2. **Use strong passwords** for your MongoDB users
3. **Rotate your API keys** regularly
4. **For production**, consider whitelisting only Vercel's IP addresses instead of allowing access from anywhere

## Database Structure

The app uses the following collection:

- **Collection Name**: `arrangements`
- **Database Name**: `sundayschool`

Each document has this structure:
```json
{
  "id": "class-1234567890",
  "time": "主日 10:00 AM",
  "beginningDate": "本季第一個主日",
  "duration": "1 小時",
  "place": "大廳",
  "teacher": "待定",
  "focusLevel": "基礎聖經研讀",
  "group": "混合成人"
}
```

## Support

If you encounter any issues, check:
1. [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
2. [Vercel Documentation](https://vercel.com/docs)
3. Your browser's developer console for error messages
