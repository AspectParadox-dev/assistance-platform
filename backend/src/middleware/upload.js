const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const STORAGE_BACKEND = process.env.STORAGE_BACKEND || 'local';
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

// Document uploads accept office/image types only; CSV is handled separately.
const ALLOWED_DOC_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const ALLOWED_CSV_TYPES = ['text/csv', 'application/csv', 'application/vnd.ms-excel'];

// When using S3, buffer the file in memory so the service can upload it.
// When using local disk, write directly to the uploads directory as before.
const storage = STORAGE_BACKEND === 's3'
  ? multer.memoryStorage()
  : (() => {
      if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      return multer.diskStorage({
        destination: (req, file, cb) => cb(null, UPLOAD_DIR),
        filename: (req, file, cb) => {
          const ext = path.extname(file.originalname);
          cb(null, `${uuidv4()}${ext}`);
        },
      });
    })();

const docFileFilter = (req, file, cb) => {
  if (!ALLOWED_DOC_TYPES.includes(file.mimetype)) {
    return cb(new Error(`File type not allowed: ${file.mimetype}. Accepted types: PDF, JPG, PNG, DOCX.`), false);
  }
  cb(null, true);
};

const csvFileFilter = (req, file, cb) => {
  if (!ALLOWED_CSV_TYPES.includes(file.mimetype)) {
    return cb(new Error(`Only CSV files are accepted for import. Received: ${file.mimetype}`), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter: docFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const csvUpload = multer({
  storage,
  fileFilter: csvFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB for CSV
});

const uploadSingle = upload.single('file');
const uploadMultiple = upload.array('files', 10);
const uploadCsv = csvUpload.single('csv');

module.exports = { uploadSingle, uploadMultiple, uploadCsv };
