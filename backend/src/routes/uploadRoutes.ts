import express from "express";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { uploadDir } from "../utils/paths.js";
import { auth, type AuthRequest } from "../auth.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});
const upload = multer({ storage });


router.post("/", auth, upload.single("image"), async (req: AuthRequest, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  try {
    const inputPath = path.join(uploadDir, req.file.filename);
    const resizedFilename = `resized-${req.file.filename}`;
    const outputPath = path.join(uploadDir, resizedFilename);

    await sharp(inputPath)
      .resize(256, 256, { fit: "cover", position: "centre" })
      .jpeg({ quality: 80 })
      .toFile(outputPath);

    fs.unlinkSync(inputPath);
    const filePath = `/uploads/${resizedFilename}`;
    res.json({ message: "Upload successful", path: filePath });
  } catch (err) {
    console.error("❌ Image processing failed:", err);
    res.status(500).json({ error: "Failed to process image" });
  }
});


export default router;