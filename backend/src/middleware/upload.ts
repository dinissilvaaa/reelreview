// ============================================================================
// middleware/upload.ts
// Multer configuration for movie poster uploads (multipart/form-data).
// Files are saved to the /uploads folder and served by Express at
// http://<api>/uploads/<file-name>.
// ============================================================================

import fs from 'node:fs'; // File system (used to create the folder)
import path from 'node:path'; // Path helpers
import crypto from 'node:crypto'; // Random bytes for unique file names
import multer from 'multer'; // Middleware that parses multipart/form-data (file uploads)
import { HttpError } from '../utils/HttpError'; // Error with HTTP status

export const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads'); // Absolute path: <backend>/uploads
export const MAX_POSTER_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB size limit per image

fs.mkdirSync(UPLOADS_DIR, { recursive: true }); // Create the folder if it does not exist yet

// Allowed image types and the file extension we save them with
const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg', // JPEG photos
  'image/png': '.png', // PNG images
  'image/webp': '.webp', // WebP images
  'image/gif': '.gif', // GIF images
};

// Where and how files are stored on disk
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR), // Always save inside /uploads
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`; // Timestamp + random -> no collisions
    const extension = ALLOWED_MIME_TYPES[file.mimetype] ?? ''; // Extension based on the real type, not the user's file name
    cb(null, `poster-${unique}${extension}`); // e.g. poster-1731500000000-a1b2c3d4e5f6.jpg
  },
});

// Reject anything that is not one of the allowed image types
const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (Object.hasOwn(ALLOWED_MIME_TYPES, file.mimetype)) {
    cb(null, true); // Accept the file
  } else {
    cb(new HttpError(400, 'Poster must be a JPG, PNG, WEBP or GIF image')); // Reject with 400 Bad Request
  }
};

// Ready-to-use middleware: reads ONE file from the form field named "poster"
export const uploadPoster = multer({
  storage, // Disk storage defined above
  fileFilter, // Type check defined above
  limits: { fileSize: MAX_POSTER_SIZE_BYTES, files: 1 }, // Max 2 MB, max 1 file
}).single('poster');
