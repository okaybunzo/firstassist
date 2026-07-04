import fs from "node:fs";
import path from "node:path";

export const UPLOADS_DIR = path.resolve(
  process.cwd(),
  process.env.UPLOADS_DIR ?? "./uploads"
);

export function ensureUploadsDir() {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export function absoluteUploadPath(relativePath: string): string {
  return path.join(UPLOADS_DIR, relativePath);
}
