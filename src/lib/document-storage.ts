import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// The private document directory is located OUTSIDE public/ on the server
const PRIVATE_STORAGE_DIR = path.resolve(process.cwd(), 'storage', 'private_documents');

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB limit

export interface StoredFileInfo {
  storageKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

/**
 * Ensures the private storage directory exists
 */
async function ensureStorageDir(): Promise<void> {
  try {
    await fs.mkdir(PRIVATE_STORAGE_DIR, { recursive: true });
  } catch {
    // Already exists
  }
}

/**
 * Sanitizes an incoming filename against path traversal and dangerous characters
 */
export function sanitizeFilename(filename: string): string {
  // Strip path separators, null bytes, and traversal attempts
  const base = path.basename(filename).replace(/[\0\r\n\t]/g, '');
  // Retain only safe alphanumeric characters, dashes, underscores, and dots
  const sanitized = base.replace(/[^a-zA-Z0-9._-]/g, '_');
  return sanitized.substring(0, 100);
}

/**
 * Validates a file's MIME type and size on the server
 */
export function validateFileMetadata(
  mimeType: string,
  sizeBytes: number,
  originalFilename: string
): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
    return {
      valid: false,
      error: `Disallowed file type '${mimeType}'. Only PDF, JPEG, PNG, and WebP are permitted.`,
    };
  }

  if (sizeBytes <= 0) {
    return { valid: false, error: 'File is empty.' };
  }

  if (sizeBytes > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds the 10 MB maximum limit (received ${(sizeBytes / (1024 * 1024)).toFixed(2)} MB).`,
    };
  }

  const ext = path.extname(originalFilename).toLowerCase();
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
  if (!allowedExtensions.includes(ext)) {
    return {
      valid: false,
      error: `File extension '${ext}' does not match allowed document types (.pdf, .jpg, .jpeg, .png, .webp).`,
    };
  }

  return { valid: true };
}

/**
 * Safely saves a file buffer into private server storage
 */
export async function savePrivateDocument(
  fileBuffer: Buffer,
  originalFilename: string,
  mimeType: string
): Promise<StoredFileInfo> {
  await ensureStorageDir();

  const validation = validateFileMetadata(mimeType, fileBuffer.length, originalFilename);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const safeName = sanitizeFilename(originalFilename);
  const randomId = crypto.randomUUID();
  const storageKey = `${randomId}-${safeName}`;

  const targetPath = path.resolve(PRIVATE_STORAGE_DIR, storageKey);

  // Strict path traversal defense
  if (!targetPath.startsWith(PRIVATE_STORAGE_DIR)) {
    throw new Error('SECURITY ALERT: Path traversal attempt blocked.');
  }

  await fs.writeFile(targetPath, fileBuffer);

  return {
    storageKey,
    originalName: safeName,
    mimeType,
    sizeBytes: fileBuffer.length,
  };
}

/**
 * Safely retrieves a file buffer from private server storage
 */
export async function readPrivateDocument(storageKey: string): Promise<{ buffer: Buffer; mimeType?: string }> {
  await ensureStorageDir();

  // Sanitize key
  const safeKey = path.basename(storageKey);
  const targetPath = path.resolve(PRIVATE_STORAGE_DIR, safeKey);

  // Strict path traversal defense
  if (!targetPath.startsWith(PRIVATE_STORAGE_DIR)) {
    throw new Error('SECURITY ALERT: Path traversal attempt blocked.');
  }

  try {
    const buffer = await fs.readFile(targetPath);
    return { buffer };
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      throw new Error('DOCUMENT_NOT_FOUND: Document file does not exist in private storage.');
    }
    throw err;
  }
}

/**
 * Safely deletes a file from private server storage
 */
export async function deletePrivateDocument(storageKey: string): Promise<boolean> {
  const safeKey = path.basename(storageKey);
  const targetPath = path.resolve(PRIVATE_STORAGE_DIR, safeKey);

  if (!targetPath.startsWith(PRIVATE_STORAGE_DIR)) {
    throw new Error('SECURITY ALERT: Path traversal attempt blocked.');
  }

  try {
    await fs.unlink(targetPath);
    return true;
  } catch {
    return false;
  }
}
