const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Allowed MIME types and extensions
const ALLOWED_MIME_TYPES = new Set([
  // Images
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
]);

const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.gif',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv',
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueId = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
    cb(null, `${uniqueId}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();

  // Explicitly block high-risk dangerous file extensions
  const dangerousExts = ['.html', '.htm', '.svg', '.exe', '.bat', '.cmd', '.sh', '.php', '.js', '.vbs'];
  if (dangerousExts.includes(ext) || ext === '.svg' || mime.includes('svg')) {
    return cb(new Error('Executable or script files like SVG, HTML, and binaries are strictly prohibited.'), false);
  }

  if (!ALLOWED_EXTENSIONS.has(ext) || !ALLOWED_MIME_TYPES.has(mime)) {
    return cb(new Error(`Invalid file type (${ext || 'unknown'}). Allowed formats: JPG, PNG, WEBP, GIF, PDF, DOC, DOCX, XLS, XLSX, TXT, CSV.`), false);
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB maximum
  },
});

module.exports = upload;