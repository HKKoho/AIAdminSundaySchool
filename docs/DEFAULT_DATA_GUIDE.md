# Default Sunday School Class Data Guide

## Overview

The application now includes 7 default class arrangements based on your seasonal schedule (季度課程表).

## Default Classes Included

### 1. 長者班 (Elder Class)
- **焦點/級別:** 利未記 - 初讀
- **時間:** 主日 11:30 AM
- **開始日期:** 2026年1月5日
- **地點:** 講台下右邊
- **老師:** 張淑佳牧師

### 2. 導修班 (Mentor Class)
- **焦點/級別:** 報名參加
- **時間:** 主日 11:30 AM
- **開始日期:** 2026年1月5日
- **地點:** 講台
- **老師:** 黃月保執事

### 3. 初讀班 (Beginner Class)
- **焦點/級別:** 以弗所 + 歌羅西
- **時間:** 主日 11:30 AM
- **開始日期:** 2026年1月5日
- **地點:** 廚房外面
- **老師:** 陳潤生傳道 + 葉國良弟兄

### 4. 應用班 (Application Class)
- **焦點/級別:** 約伯記、箴言、傳道書 - 反常、正常、無常的人生
- **時間:** 主日 11:30 AM
- **開始日期:** 2026年1月5日
- **地點:** 音響室前
- **老師:** 熊天佑弟兄

### 5. 少年班 (Youth Class)
- **焦點/級別:** 交流少年時代有趣的事
- **時間:** 主日 11:30 AM
- **開始日期:** 2026年1月5日
- **地點:** 升降🚗前
- **老師:** 劉維廣傳道

### 6. 福音班 (Gospel Class)
- **焦點/級別:** (待定)
- **時間:** 主日 11:30 AM
- **開始日期:** 有需要
- **地點:** 音響室前與近門前
- **老師:** 錢振玉姊妹

### 7. 成長8課 (Growth 8-Week Course)
- **焦點/級別:** 初信
- **時間:** 主日 11:30 AM
- **開始日期:** 有需要
- **地點:** 傳道房或教會外
- **老師:** 譚約平弟兄

## When Default Data Appears

The default data will automatically load when:

### localStorage Mode
- First time visiting the app (no previous data)
- After clearing browser data/cache
- When accessing from a new browser/device

### MongoDB Mode
- When MongoDB is empty (no documents in `arrangements` collection)
- After manually clearing the database

## Importing Default Data

### Option 1: Automatic (First Load)
1. Visit the app for the first time
2. Navigate to "課程" (Classes)
3. All 7 default classes will be displayed

### Option 2: Manual Import
1. Go to "課程" (Classes) section
2. Click "管理課程" (password: `cklbckoho`)
3. Click "匯入" (Import)
4. Select the `default-arrangements.json` file from the project root

### Option 3: MongoDB Direct Import (For Developers)

Using MongoDB Compass or CLI:

```bash
# Connect to your MongoDB database
mongosh "your_connection_string"

# Switch to database
use sundayschool

# Import the JSON file
mongoimport --uri="your_connection_string" \
  --collection=arrangements \
  --file=default-arrangements.json \
  --jsonArray
```

Or using MongoDB Compass GUI:
1. Connect to your cluster
2. Navigate to `sundayschool` database
3. Select `arrangements` collection
4. Click "Add Data" → "Import File"
5. Select `default-arrangements.json`
6. Click "Import"

## Modifying Default Data

### For Code Changes

Edit `hooks/useArrangements.ts`:

```typescript
const defaultArrangements: ClassArrangementInfo[] = [
  {
    id: 'class-elder-1',
    time: '主日 11:30 AM',
    beginningDate: '2026年1月5日',
    duration: '1 小時',
    place: '講台下右邊',
    teacher: '張淑佳牧師',
    focusLevel: '利未記 - 初讀',
    group: '長者班',
  },
  // ... add more or modify existing
];
```

### For JSON File Changes

Edit `default-arrangements.json`:

```json
[
  {
    "id": "class-elder-1",
    "time": "主日 11:30 AM",
    "beginningDate": "2026年1月5日",
    "duration": "1 小時",
    "place": "講台下右邊",
    "teacher": "張淑佳牧師",
    "focusLevel": "利未記 - 初讀",
    "group": "長者班"
  }
]
```

## Resetting to Default Data

### localStorage Mode
```javascript
// Open browser console
localStorage.removeItem('classArrangements');
location.reload();
```

### MongoDB Mode
1. Export current data as backup (optional)
2. Delete all arrangements via UI or MongoDB
3. Import `default-arrangements.json`

Or via MongoDB CLI:
```javascript
// Delete all arrangements
db.arrangements.deleteMany({});

// Data will auto-populate on next app load (localStorage mode)
// Or manually import the JSON file
```

## Field Descriptions

Each class arrangement has these fields:

| Field | Description | Example |
|-------|-------------|---------|
| `id` | Unique identifier | `class-elder-1` |
| `time` | Class time | `主日 11:30 AM` |
| `beginningDate` | Start date | `2026年1月5日` |
| `duration` | Class duration | `1 小時` |
| `place` | Location | `講台下右邊` |
| `teacher` | Teacher name(s) | `張淑佳牧師` |
| `focusLevel` | Study focus/topic | `利未記 - 初讀` |
| `group` | Class group name | `長者班` |

## Tips

### Customizing for Your Church
1. Edit the default data in code or JSON
2. Update class names, times, and locations
3. Modify teacher names and study topics
4. Deploy and all new users will see your defaults

### Seasonal Updates
1. Export current semester's data
2. Update default data for new semester
3. Import or manually update via UI
4. Keep exported files as historical records

### Multi-Language Support
- All fields support Chinese characters
- Emoji are supported (e.g., 🚗 in location)
- Unicode characters display correctly

## Troubleshooting

### Issue: Default data not showing

**Check:**
1. Clear browser localStorage
2. Verify MongoDB connection (if using)
3. Check browser console for errors

### Issue: Duplicate data after import

**Cause:** Importing defaults when data already exists

**Solution:**
1. Export existing data as backup
2. Delete all arrangements
3. Import fresh default data

### Issue: Some classes missing

**Check:**
1. Verify all 7 classes in `defaultArrangements` array
2. Check JSON file is valid (use JSON validator)
3. Ensure no ID conflicts

## Version History

- **v1.0** - Initial default data with 7 classes
- Based on 2026 Q1 schedule
- Includes all major class types

## Future Enhancements

Potential features:
- [ ] Multiple semester templates
- [ ] Quick reset to defaults button in UI
- [ ] Backup/restore default data
- [ ] Import from Google Sheets/Excel
- [ ] Template management system
