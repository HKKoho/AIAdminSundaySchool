import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import dotenv from 'dotenv';

dotenv.config();

const execPromise = promisify(exec);
const app = express();
const PORT = process.env.BRIDGE_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads (temporary storage)
const upload = multer({ dest: 'uploads/' });

// NAS Configuration from environment variables
const NAS_CONFIG = {
  host: process.env.NAS_HOST || '192.168.1.100', // Your Synology NAS IP
  share: process.env.NAS_SHARE || 'documents', // Share name on NAS
  username: process.env.NAS_USERNAME || 'admin',
  password: process.env.NAS_PASSWORD || '',
  basePath: process.env.NAS_BASE_PATH || '/DocumentHub', // Base folder in share
};

/**
 * Upload file to Synology NAS via SMB
 */
async function uploadToNAS(localFilePath, nasFilePath) {
  const smbPath = `//${NAS_CONFIG.host}/${NAS_CONFIG.share}${nasFilePath}`;
  const domain = process.env.NAS_DOMAIN || 'WORKGROUP';

  // Create directory on NAS if it doesn't exist
  const dirPath = path.dirname(nasFilePath);
  const smbDirPath = `//${NAS_CONFIG.host}/${NAS_CONFIG.share}${dirPath}`;

  try {
    // Create directory (this command works on both Mac/Linux)
    const mkdirCmd = `smbutil mkdir -a "${NAS_CONFIG.username}:${NAS_CONFIG.password}@${NAS_CONFIG.host}/${NAS_CONFIG.share}" "${dirPath}"`;
    await execPromise(mkdirCmd).catch(() => {
      // Directory might already exist, ignore error
    });

    // Copy file to NAS
    // For macOS: use mount + cp
    const mountPoint = '/tmp/nas_mount';
    const mountCmd = `
      mkdir -p ${mountPoint} &&
      mount -t smbfs //"${NAS_CONFIG.username}:${NAS_CONFIG.password}@${NAS_CONFIG.host}/${NAS_CONFIG.share}" ${mountPoint} &&
      cp "${localFilePath}" "${mountPoint}${nasFilePath}" &&
      umount ${mountPoint}
    `;

    await execPromise(mountCmd);

    // Clean up local file
    await fs.unlink(localFilePath);

    return true;
  } catch (error) {
    console.error('Error uploading to NAS:', error);
    throw new Error(`Failed to upload file to NAS: ${error.message}`);
  }
}

/**
 * Download file from Synology NAS via SMB
 */
async function downloadFromNAS(nasFilePath, localFilePath) {
  try {
    const mountPoint = '/tmp/nas_mount';
    const mountCmd = `
      mkdir -p ${mountPoint} &&
      mkdir -p $(dirname "${localFilePath}") &&
      mount -t smbfs //"${NAS_CONFIG.username}:${NAS_CONFIG.password}@${NAS_CONFIG.host}/${NAS_CONFIG.share}" ${mountPoint} &&
      cp "${mountPoint}${nasFilePath}" "${localFilePath}" &&
      umount ${mountPoint}
    `;

    await execPromise(mountCmd);
    return true;
  } catch (error) {
    console.error('Error downloading from NAS:', error);
    throw new Error(`Failed to download file from NAS: ${error.message}`);
  }
}

/**
 * Delete file from Synology NAS via SMB
 */
async function deleteFromNAS(nasFilePath) {
  try {
    const mountPoint = '/tmp/nas_mount';
    const mountCmd = `
      mkdir -p ${mountPoint} &&
      mount -t smbfs //"${NAS_CONFIG.username}:${NAS_CONFIG.password}@${NAS_CONFIG.host}/${NAS_CONFIG.share}" ${mountPoint} &&
      rm "${mountPoint}${nasFilePath}" &&
      umount ${mountPoint}
    `;

    await execPromise(mountCmd);
    return true;
  } catch (error) {
    console.error('Error deleting from NAS:', error);
    throw new Error(`Failed to delete file from NAS: ${error.message}`);
  }
}

// ===== API Endpoints =====

/**
 * POST /upload - Upload file to NAS
 * Expects: multipart/form-data with 'file' and metadata fields
 */
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const { department, year, docType } = req.body;

    // Create organized path: /DocumentHub/{year}/{department}/{docType}/{filename}
    const nasFilePath = path.join(
      NAS_CONFIG.basePath,
      year || 'misc',
      department || 'general',
      docType || 'other',
      req.file.originalname
    );

    // Upload to NAS
    await uploadToNAS(req.file.path, nasFilePath);

    res.json({
      success: true,
      data: {
        filePath: nasFilePath,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /download - Download file from NAS
 * Query params: filePath
 */
app.get('/download', async (req, res) => {
  try {
    const { filePath } = req.query;

    if (!filePath) {
      return res.status(400).json({ success: false, error: 'File path required' });
    }

    const localFilePath = path.join('downloads', path.basename(filePath));

    // Download from NAS
    await downloadFromNAS(filePath, localFilePath);

    // Send file to client
    res.download(localFilePath, async (err) => {
      // Clean up local file after sending
      try {
        await fs.unlink(localFilePath);
      } catch (cleanupError) {
        console.error('Error cleaning up downloaded file:', cleanupError);
      }

      if (err) {
        console.error('Error sending file:', err);
      }
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /delete - Delete file from NAS
 * Query params: filePath
 */
app.delete('/delete', async (req, res) => {
  try {
    const { filePath } = req.query;

    if (!filePath) {
      return res.status(400).json({ success: false, error: 'File path required' });
    }

    await deleteFromNAS(filePath);

    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /health - Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'running',
    nas: {
      host: NAS_CONFIG.host,
      share: NAS_CONFIG.share,
      basePath: NAS_CONFIG.basePath,
    },
  });
});

// Create necessary directories
await fs.mkdir('uploads', { recursive: true });
await fs.mkdir('downloads', { recursive: true });

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Bridge Server running on http://localhost:${PORT}`);
  console.log(`📁 NAS Config: ${NAS_CONFIG.username}@${NAS_CONFIG.host}/${NAS_CONFIG.share}${NAS_CONFIG.basePath}`);
  console.log('💡 Make sure your Synology NAS is accessible on your network');
});
