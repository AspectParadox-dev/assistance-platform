const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const BACKEND = process.env.STORAGE_BACKEND || 'local';
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

// Lazy-load AWS SDK only when S3 is configured — avoids crashing if package isn't installed
let s3Client, S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, getSignedUrl;
if (BACKEND === 's3') {
  try {
    ({ S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3'));
    ({ getSignedUrl } = require('@aws-sdk/s3-request-presigner'));
    s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  } catch {
    throw new Error('STORAGE_BACKEND=s3 requires @aws-sdk/client-s3 and @aws-sdk/s3-request-presigner packages.');
  }
}

/**
 * Upload a file buffer to the configured storage backend.
 * Returns { storagePath, filename } — storagePath is either a local file path or an S3 object key.
 */
async function upload(buffer, originalName, mimeType) {
  const ext = path.extname(originalName);
  const id = uuidv4();

  if (BACKEND === 's3') {
    const key = `documents/${id}${ext}`;
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    }));
    return { storagePath: key, filename: `${id}${ext}` };
  }

  // Local disk
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const filename = `${id}${ext}`;
  const filePath = path.join(UPLOAD_DIR, filename);
  fs.writeFileSync(filePath, buffer);
  return { storagePath: filePath, filename };
}

/**
 * Generate a download URL for the given storagePath.
 * Returns null for local storage (caller handles via res.download).
 * Returns a pre-signed URL for S3 storage (valid for 1 hour).
 */
async function getDownloadUrl(storagePath) {
  if (BACKEND !== 's3') return null;
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: storagePath,
  });
  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

/**
 * Delete a file from the configured storage backend.
 */
async function remove(storagePath) {
  if (BACKEND === 's3') {
    await s3Client.send(new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: storagePath,
    }));
    return;
  }
  if (fs.existsSync(storagePath)) fs.unlinkSync(storagePath);
}

function isS3() {
  return BACKEND === 's3';
}

module.exports = { upload, getDownloadUrl, remove, isS3 };
