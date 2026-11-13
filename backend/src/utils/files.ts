// ============================================================================
// utils/files.ts
// Helpers to delete poster images stored in the /uploads folder.
// ============================================================================

import fs from 'node:fs/promises'; // Promise-based file system API
import path from 'node:path'; // Safe path manipulation
import { UPLOADS_DIR } from '../middleware/upload'; // Absolute path of the uploads folder

/**
 * Deletes a poster file if (and only if) it was uploaded to this server.
 * External URLs (https://...) are ignored. Missing files are ignored too.
 */
export async function deleteLocalPoster(posterUrl?: string): Promise<void> {
  if (!posterUrl || !posterUrl.startsWith('/uploads/')) return; // Not one of our files -> nothing to do
  const fileName = path.basename(posterUrl); // basename() strips any "../" -> prevents path traversal attacks
  await fs.unlink(path.join(UPLOADS_DIR, fileName)).catch(() => undefined); // Delete, ignoring "file not found"
}

/**
 * Deletes a file that Multer just saved (used when the request fails
 * validation after the upload, so we do not keep orphan images).
 */
export async function removeUploadedFile(file?: Express.Multer.File): Promise<void> {
  if (!file) return; // No file in this request
  await fs.unlink(file.path).catch(() => undefined); // Delete, ignoring "file not found"
}
