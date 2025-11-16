# Testing SMB Access to Your Synology NAS

After enabling SMB on your Synology NAS, test the connection from your computer.

## Find Your NAS IP Address

If you don't know your NAS IP address:

1. In Synology DSM: **Control Panel** → **Network** → **Network Interface**
2. Look for **LAN** section
3. Note the IP address (e.g., `192.168.1.100`)

## Test SMB Connection

### On macOS:

**Method 1: Finder**
1. Open **Finder**
2. Press `⌘ + K` (or Go → Connect to Server)
3. Enter: `smb://192.168.1.100/documents`
   - Replace `192.168.1.100` with your NAS IP
   - Replace `documents` with your share name
4. Click **Connect**
5. When prompted:
   - **Name**: Your Synology username
   - **Password**: Your Synology password
6. Click **Connect**

If successful, you'll see the shared folder mounted on your desktop!

**Method 2: Terminal**
```bash
# Test if NAS is reachable
ping 192.168.1.100

# Test SMB connection
smbutil status -a 192.168.1.100

# List available shares
smbutil view //192.168.1.100
```

### On Windows:

**Method 1: File Explorer**
1. Open **File Explorer**
2. In the address bar, type: `\\192.168.1.100\documents`
   - Replace with your NAS IP and share name
3. Press **Enter**
4. When prompted, enter:
   - **Username**: Your Synology username
   - **Password**: Your Synology password
   - ☑ **Remember my credentials** (optional)
5. Click **OK**

**Method 2: Map Network Drive**
1. Open **File Explorer**
2. Click **This PC** → **Map network drive**
3. Choose a drive letter (e.g., Z:)
4. Folder: `\\192.168.1.100\documents`
5. ☑ **Reconnect at sign-in**
6. Click **Finish**
7. Enter credentials when prompted

**Method 3: Command Prompt**
```cmd
REM Test if NAS is reachable
ping 192.168.1.100

REM List available shares
net view \\192.168.1.100

REM Map network drive
net use Z: \\192.168.1.100\documents /user:your-username
```

### On Linux:

**Method 1: File Manager (GUI)**
1. Open your file manager (Nautilus, Dolphin, etc.)
2. Look for "Connect to Server" or "Other Locations"
3. Enter: `smb://192.168.1.100/documents`
4. Enter credentials when prompted

**Method 2: Terminal**
```bash
# Install smbclient if not installed
sudo apt-get install smbclient  # Ubuntu/Debian
sudo yum install samba-client   # CentOS/RHEL

# Test connection
smbclient -L //192.168.1.100 -U your-username

# List files in share
smbclient //192.168.1.100/documents -U your-username
```

**Method 3: Mount permanently**
```bash
# Create mount point
sudo mkdir -p /mnt/nas/documents

# Install cifs-utils
sudo apt-get install cifs-utils

# Mount the share
sudo mount -t cifs //192.168.1.100/documents /mnt/nas/documents \
  -o username=your-username,password=your-password

# Or add to /etc/fstab for automatic mounting:
# //192.168.1.100/documents /mnt/nas/documents cifs username=your-username,password=your-password,iocharset=utf8 0 0
```

## Troubleshooting

### "Can't connect to server"

**Check network connectivity:**
```bash
ping 192.168.1.100
```
- If ping fails: Check NAS is powered on and connected to network
- If ping succeeds but SMB fails: Continue below

**Check SMB is enabled:**
1. Log into Synology DSM
2. Control Panel → File Services → SMB
3. Verify "Enable SMB service" is checked
4. Check it shows "Running" status

**Check firewall:**
- Synology firewall: Control Panel → Security → Firewall
- If firewall is enabled, make sure SMB ports are allowed:
  - Port 445 (SMB)
  - Port 139 (NetBIOS)

### "Access denied" or "Permission denied"

**Check user permissions:**
1. Synology DSM → Control Panel → Shared Folder
2. Click on your shared folder (e.g., "documents")
3. Click **Edit** → **Permissions**
4. Verify your user has **Read/Write** permission

**Check user account:**
1. Control Panel → User & Group → User
2. Verify your account exists and is enabled
3. Try resetting password if unsure

### "Invalid username or password"

- Double-check username (case-sensitive)
- Double-check password
- Try logging into DSM web interface first to verify credentials
- If using domain, format may need to be: `DOMAIN\username`

### Speed is very slow

**Optimize SMB settings:**
1. DSM → Control Panel → File Services → SMB → Advanced
2. Enable these for better performance:
   - ☑ Enable SMB3 MULTICHANNEL
   - ☑ Enable SMB3 multi-channel (if your NAS supports it)
   - Set "Transport encryption mode" to "Auto" or "Disabled" for speed

### macOS-specific: "Operation could not be completed"

Try these SMB URL formats:
```
smb://192.168.1.100/documents
smb://username@192.168.1.100/documents
smb://username:password@192.168.1.100/documents
```

Or specify SMB version:
```bash
# In Terminal
mount_smbfs -o vers=3.0 //username@192.168.1.100/documents /Volumes/documents
```

## Verify SMB is Working

### Create a test file:

**macOS/Linux:**
```bash
# After mounting the share
echo "SMB test successful!" > /path/to/mounted/share/test.txt
```

**Windows:**
```cmd
echo SMB test successful! > Z:\test.txt
```

### Check in Synology:

1. Open **File Station** in DSM
2. Navigate to your `documents` share
3. You should see `test.txt`
4. Open it to verify content

## Security Tips

1. **Use strong passwords** for NAS accounts
2. **Don't use admin account** for SMB - create dedicated user
3. **Limit network access** - enable firewall, allow only local network
4. **Enable 2FA** on your Synology account (DSM 6.0+)
5. **Disable SMB1** - it's insecure (should already be disabled)
6. **Use encrypted shares** if storing sensitive data
7. **Regular backups** - SMB access = delete access too!

## Next Steps

Once SMB is working:

1. ✓ SMB enabled on Synology
2. ✓ Shared folder created
3. ✓ Can access from your computer
4. → Now configure bridge server with these credentials
5. → Test Document Hub upload

See `bridge-server/.env.example` for configuration template.
