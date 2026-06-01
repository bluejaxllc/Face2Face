import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// The directory where uploaded files will be stored.
// In Railway, this is mounted to the persistent volume at /app/uploads
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Ensure the directory exists
async function ensureUploadsDir() {
  try {
    await fs.access(UPLOADS_DIR);
  } catch {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  }
}

/**
 * Uploads a base64 encoded image to the persistent volume and returns the public URL.
 * @param base64String The raw base64 string (can include data:image/png;base64, prefix)
 * @param userId The user ID to associate the image with
 * @param prefix 'profile' or 'banner'
 * @returns The public URL to the image (e.g. /uploads/profile_1_abc.png)
 */
export async function uploadImageFromBase64(base64String: string, userId: number, prefix: string): Promise<string> {
  await ensureUploadsDir();

  // Parse the base64 string to extract mime type and raw data
  const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid base64 string format');
  }

  const mimeType = matches[1];
  const rawBase64 = matches[2];

  // Determine file extension
  let ext = 'png';
  if (mimeType === 'image/jpeg') ext = 'jpg';
  else if (mimeType === 'image/webp') ext = 'webp';
  else if (mimeType === 'image/gif') ext = 'gif';

  // Generate a unique filename: prefix_userId_randomHex.ext
  const randomHex = crypto.randomBytes(4).toString('hex');
  const filename = `${prefix}_${userId}_${randomHex}.${ext}`;
  const filepath = path.join(UPLOADS_DIR, filename);

  // Convert base64 to Buffer and write to disk
  const buffer = Buffer.from(rawBase64, 'base64');
  await fs.writeFile(filepath, buffer);

  // Return the public URL path
  return `/uploads/${filename}`;
}
