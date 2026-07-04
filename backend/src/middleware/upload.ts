import crypto from "node:crypto";
import path from "node:path";
import multer from "multer";
import { UPLOADS_DIR, ensureUploadsDir } from "../services/storage";

ensureUploadsDir();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const unique = crypto.randomUUID();
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

export const upload = multer({ storage });
