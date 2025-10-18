# LocalStorage Fallback Mode

## Overview

The application now automatically falls back to localStorage when MongoDB is unavailable. This ensures the app works even without MongoDB configuration.

## How It Works

### Automatic Detection
1. On first load, the app attempts to connect to MongoDB
2. If MongoDB is unavailable (500 error, connection timeout, etc.), it automatically switches to localStorage
3. A yellow info banner displays: "使用本地儲存（MongoDB 未配置）"
4. All CRUD operations work normally using browser localStorage

### Storage Modes

#### MongoDB Mode (Cloud Storage)
- **When Active:** MongoDB connection successful
- **Data Location:** MongoDB Atlas database
- **Persistence:** Data synced across devices and browsers
- **Indicator:** No warning banner shown

#### localStorage Mode (Browser Storage)
- **When Active:** MongoDB unavailable or not configured
- **Data Location:** Browser's localStorage
- **Persistence:** Data stored locally per browser/device
- **Indicator:** Yellow info banner displayed

## User Experience

### Warning Banner

When in localStorage mode, users see:

```
ℹ️ 資訊
使用本地儲存（MongoDB 未配置）
資料儲存在瀏覽器本地，不會同步到雲端。若需使用雲端儲存，請在 Vercel 設定 MongoDB 環境變數。
```

Translation:
```
ℹ️ Info
Using local storage (MongoDB not configured)
Data is stored locally in the browser and will not sync to the cloud. To use cloud storage, configure MongoDB environment variables in Vercel.
```

### All Features Work

Both modes support:
- ✅ Create new arrangements
- ✅ Edit existing arrangements
- ✅ Delete arrangements
- ✅ Export to JSON
- ✅ Import from JSON

## For Developers

### Configuration

The fallback mechanism uses two localStorage keys:

```typescript
const STORAGE_KEY = 'classArrangements';        // Stores arrangement data
const USE_MONGODB_KEY = 'useMongoDBStorage';    // Stores mode preference
```

### Force MongoDB Retry

To retry MongoDB connection:

1. Open browser console
2. Run:
   ```javascript
   localStorage.setItem('useMongoDBStorage', 'true');
   location.reload();
   ```

### Check Current Mode

From browser console:
```javascript
// Check if using MongoDB
localStorage.getItem('useMongoDBStorage') === 'true'

// View stored arrangements
JSON.parse(localStorage.getItem('classArrangements'))
```

## Deployment Scenarios

### Scenario 1: No MongoDB (Default Fallback)
- Deploy to Vercel without MongoDB configuration
- App uses localStorage automatically
- Perfect for testing or single-user scenarios

### Scenario 2: MongoDB Configured Later
- Deploy initially without MongoDB
- Add `MONGODB_URI` environment variable later
- Users clear localStorage or browser cache
- App automatically switches to MongoDB on next load

### Scenario 3: MongoDB Temporarily Unavailable
- MongoDB configured but temporarily down
- App automatically falls back to localStorage
- When MongoDB recovers, manually trigger retry (see above)

## Data Migration

### From localStorage to MongoDB

1. While in localStorage mode, export data:
   ```
   Click "匯出" (Export) button
   ```

2. Configure MongoDB in Vercel

3. Force MongoDB mode:
   ```javascript
   localStorage.setItem('useMongoDBStorage', 'true');
   location.reload();
   ```

4. Import the exported data:
   ```
   Click "匯入" (Import) button
   Select your exported JSON file
   ```

### From MongoDB to localStorage

1. Export from MongoDB:
   ```
   Click "匯出" (Export) button
   ```

2. Force localStorage mode:
   ```javascript
   localStorage.setItem('useMongoDBStorage', 'false');
   location.reload();
   ```

3. Import the data:
   ```
   Click "匯入" (Import) button
   Select your exported JSON file
   ```

## Troubleshooting

### Issue: Banner always shows even with MongoDB configured

**Solution:**
```javascript
// Clear the fallback flag
localStorage.removeItem('useMongoDBStorage');
location.reload();
```

### Issue: Data not persisting after page reload

**Check:**
1. Browser allows localStorage (not in incognito/private mode)
2. localStorage quota not exceeded
3. No browser extensions blocking storage

**Test:**
```javascript
// Test localStorage availability
try {
  localStorage.setItem('test', 'test');
  localStorage.removeItem('test');
  console.log('localStorage available');
} catch(e) {
  console.error('localStorage unavailable:', e);
}
```

### Issue: Want to clear all local data

**Solution:**
```javascript
localStorage.removeItem('classArrangements');
localStorage.removeItem('useMongoDBStorage');
location.reload();
```

## Technical Implementation

### Error Handling Flow

```
1. User performs action (create/update/delete)
   ↓
2. If useMongoDB === true
   ↓ try MongoDB API
   ↓
3. Success? → Update state
   ↓ no
4. Catch error → Set useMongoDB = false
   ↓
5. Fall through to localStorage
   ↓
6. Update localStorage
   ↓
7. Update state
```

### Benefits

✅ **Resilience:** App never breaks due to MongoDB issues
✅ **Gradual Migration:** Can deploy before MongoDB setup
✅ **User Experience:** Seamless fallback with clear communication
✅ **Data Safety:** Export/import ensures no data loss
✅ **Development:** Easy local development without MongoDB

## Best Practices

### For Production
- Configure MongoDB for multi-user scenarios
- Monitor MongoDB connection health
- Set up regular automated backups via export

### For Development
- Use localStorage mode for quick prototyping
- Test both modes during development
- Verify data export/import works correctly

### For Users
- Export data regularly as backup
- Understand limitations of localStorage (per-device)
- Migrate to MongoDB for cross-device access

## Future Enhancements

Potential improvements:
- [ ] Auto-retry MongoDB connection periodically
- [ ] Sync localStorage to MongoDB when connection restored
- [ ] Visual indicator in UI showing current storage mode
- [ ] Admin panel to manually switch storage modes
- [ ] Automatic data migration wizard
