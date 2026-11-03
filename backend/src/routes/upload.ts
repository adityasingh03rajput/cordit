import express, { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs';
import verifyToken from '../middlewares/verifyToken';
import validator from '../middlewares/validator';
import { requestUpload } from '../validators/upload';
import FileUpload from '../models/fileUpload';
import User from '../models/user';
import { uploadObject } from '../utils/s3';

const router: Router = express.Router();

const MAX_QUOTA_BYTES = 500 * 1024 * 1024; // 500MB per user
const LOCAL_UPLOADS_DIR = path.resolve(__dirname, '../../uploads');

if (!fs.existsSync(LOCAL_UPLOADS_DIR)) {
  fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
}

// GET /upload/:id/file - Stream file content directly (works with <img> tags)
router.get('/:id/file', async (req: Request, res: Response) => {
  try {
    const fileUpload = await FileUpload.findById(req.params.id);
    if (!fileUpload) {
      res.status(404).send('File not found');
      return;
    }

    const filePath = fileUpload.localPath || path.join(LOCAL_UPLOADS_DIR, `${fileUpload._id}_${fileUpload.originalName}`);
    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Type', fileUpload.mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileUpload.originalName)}"`);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
      return;
    }

    res.status(404).send('File content not found on server');
  } catch {
    res.status(500).send('Failed to serve file');
  }
});

// POST /upload/request - Get an upload URL
router.post('/request', verifyToken, validator(requestUpload), async (req: Request, res: Response) => {
  try {
    // GATE-01 Interim Mitigation: Restrict binary media uploads until automated perceptual hashing clears
    if (process.env.MEDIA_UPLOADS_ENABLED !== 'true' && req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Media uploads in stranger chat are temporarily disabled for safety pending automated perceptual hash screening (GATE-01).' });
      return;
    }
    const { fileName, mimeType, fileSize } = req.body;
    const username = req.user?.username;

    if (!username) {
      res.sendError(401, 'User not authenticated');
      return;
    }

    const user = await User.findOne({ username });
    if (!user) {
      res.sendError(404, 'User not found');
      return;
    }

    // Check quota: sum of user's active file sizes
    const activeFiles = await FileUpload.aggregate([
      { $match: { userId: user._id, expiresAt: { $gt: new Date() } } },
      { $group: { _id: null, totalSize: { $sum: '$fileSize' } } },
    ]);

    const currentUsage = activeFiles.length > 0 ? activeFiles[0].totalSize : 0;

    if (currentUsage + fileSize > MAX_QUOTA_BYTES) {
      const remainingMB = Math.max(0, Math.floor((MAX_QUOTA_BYTES - currentUsage) / 1024 / 1024));
      res.sendError(413, `Storage quota exceeded. You have ${remainingMB}MB remaining of 500MB.`);
      return;
    }

    // Generate unique S3 key
    const s3Key = `uploads/${user._id}/${randomUUID()}/${fileName}`;

    // Create FileUpload record with permanent (10 years) expiration
    const expiresAt = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000);
    const fileUpload = new FileUpload({
      userId: user._id,
      username,
      originalName: fileName,
      s3Key,
      mimeType,
      fileSize,
      expiresAt,
    });

    await fileUpload.save();

    const uploadUrl = `/api/upload/${fileUpload._id}/content`;
    const downloadUrl = `/api/upload/${fileUpload._id}/file`;

    res.sendResponse(200, {
      uploadUrl,
      fileId: fileUpload._id,
      downloadUrl,
      expiresAt,
    });
  } catch {
    res.sendError(500, 'Failed to create upload request');
  }
});

// PUT /upload/:id/content - Upload file bytes directly to server disk (and S3 if available)
router.put('/:id/content', verifyToken, express.raw({ type: '*/*', limit: '110mb' }), async (req: Request, res: Response) => {
  try {
    const username = req.user?.username;
    if (!username) {
      res.sendError(401, 'User not authenticated');
      return;
    }

    const fileUpload = await FileUpload.findById(req.params.id);
    if (!fileUpload) {
      res.sendError(404, 'File not found');
      return;
    }

    if (fileUpload.username !== username) {
      res.sendError(403, 'Forbidden');
      return;
    }

    const body = req.body as Buffer;
    if (!Buffer.isBuffer(body) || body.length === 0) {
      res.sendError(400, 'No file content provided');
      return;
    }

    if (body.length !== fileUpload.fileSize) {
      res.sendError(400, 'Uploaded file size mismatch');
      return;
    }

    // Save to local disk
    const filePath = path.join(LOCAL_UPLOADS_DIR, `${fileUpload._id}_${fileUpload.originalName}`);
    fs.writeFileSync(filePath, body);

    fileUpload.localPath = filePath;
    await fileUpload.save();

    // S3/MinIO sync fallback
    try {
      await uploadObject(fileUpload.s3Key, body, fileUpload.mimeType, fileUpload.fileSize);
    } catch {
      // MinIO not running, local storage is active
    }

    res.sendResponse(200, { uploaded: true });
  } catch {
    res.sendError(500, 'Failed to upload file content');
  }
});

// GET /upload/:id - Get a fresh download URL for a file
router.get('/:id', verifyToken, async (req: Request, res: Response) => {
  try {
    const fileUpload = await FileUpload.findById(req.params.id);
    if (!fileUpload) {
      res.sendError(404, 'File not found');
      return;
    }

    const downloadUrl = `/api/upload/${fileUpload._id}/file`;

    res.sendResponse(200, {
      downloadUrl,
      fileName: fileUpload.originalName,
      mimeType: fileUpload.mimeType,
      fileSize: fileUpload.fileSize,
      expiresAt: fileUpload.expiresAt,
    });
  } catch {
    res.sendError(500, 'Failed to get download URL');
  }
});

export default router;
