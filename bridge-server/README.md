# Document Hub Bridge Server

This local server acts as a bridge between your web application (hosted on Vercel) and your Synology NAS for file operations.

## Architecture

```
React App (Vercel)
    ↓ (metadata/auth)
Vercel API ↔ MongoDB (metadata storage)
    ↓ (file operations)
Bridge Server (local) ↔ Synology NAS (SMB)
```

## Prerequisites

1. **Node.js 20+** installed on your local machine or server
2. **Synology NAS** accessible on your network
3. **SMB file sharing** enabled on Synology
4. **Network access** between the server running this bridge and your NAS

## Setup Instructions

### Step 1: Enable SMB on Synology NAS

1. Open **Control Panel** on your Synology DSM
2. Go to **File Services** → **SMB**
3. Enable **SMB service**
4. Note your NAS IP address (e.g., 192.168.1.100)

### Step 2: Create Shared Folder

1. Open **Control Panel** → **Shared Folder**
2. Create a new folder called `documents` (or use existing)
3. Set permissions for your user account
4. Note the share name

### Step 3: Configure Bridge Server

1. Copy `.env.example` to `.env`:
   ```bash
   cd bridge-server
   cp .env.example .env
   ```

2. Edit `.env` with your NAS details:
   ```env
   NAS_HOST=192.168.1.100          # Your NAS IP
   NAS_SHARE=documents             # Your share name
   NAS_USERNAME=your-username      # Your NAS username
   NAS_PASSWORD=your-password      # Your NAS password
   NAS_BASE_PATH=/DocumentHub      # Folder in share
   ```

### Step 4: Install Dependencies

```bash
npm install
```

### Step 5: Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:3001`

### Step 6: Test the Connection

Open your browser and visit:
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

## API Endpoints

### POST /upload
Upload a file to NAS

**Request:** multipart/form-data
- `file`: The file to upload
- `department`: Department name
- `year`: Year
- `docType`: Document type

**Response:**
```json
{
  "success": true,
  "data": {
    "filePath": "/DocumentHub/2024/Executive Committee/Meeting Minutes/document.pdf",
    "fileName": "document.pdf",
    "fileSize": 1024,
    "mimeType": "application/pdf"
  }
}
```

### GET /download
Download a file from NAS

**Query params:**
- `filePath`: Path to file on NAS

**Response:** File download

### DELETE /delete
Delete a file from NAS

**Query params:**
- `filePath`: Path to file on NAS

**Response:**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

## Running as a Service (Optional)

To run the bridge server as a background service:

### On Linux (systemd):

Create `/etc/systemd/system/documenthub-bridge.service`:
```ini
[Unit]
Description=Document Hub Bridge Server
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/bridge-server
ExecStart=/usr/bin/node server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Start the service:
```bash
sudo systemctl start documenthub-bridge
sudo systemctl enable documenthub-bridge
```

### On macOS (launchd):

Create `~/Library/LaunchAgents/com.documenthub.bridge.plist`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.documenthub.bridge</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/path/to/bridge-server/server.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/path/to/bridge-server</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
```

Load the service:
```bash
launchctl load ~/Library/LaunchAgents/com.documenthub.bridge.plist
```

## Troubleshooting

### Can't connect to NAS
- Check NAS IP address is correct
- Verify SMB is enabled on Synology
- Check firewall settings
- Ensure credentials are correct

### Permission denied
- Check NAS user has write permissions to the share
- Verify the shared folder exists

### Mount errors
- Make sure `/tmp/nas_mount` directory can be created
- Check if another process is using the mount point

## Security Notes

1. **Never commit `.env` file** to version control
2. Store `.env` securely on the server
3. Use strong passwords for NAS access
4. Consider using API keys for bridge server access
5. Run bridge server on a trusted network only
6. Consider using HTTPS/TLS if exposing to internet

## Alternative: Run on Synology NAS via Docker

You can also run this bridge server as a Docker container on your Synology NAS:

1. Enable Docker in Synology Package Center
2. Create a Dockerfile in the bridge-server folder
3. Build and deploy on your NAS
4. Mount the shared folder as a volume

This gives direct file system access without SMB mounting.
