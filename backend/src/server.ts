import express, { type Request, type Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "src/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use("/uploads", express.static(uploadDir));

// configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});
const upload = multer({ storage });


app.get("/", (req: Request, res: Response) => {
  res.send("Tierlist backend is running 🚀 (TypeScript + PostgreSQL + Prisma)");
});


app.post("/api/upload", upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  try {
    const inputPath = path.join(uploadDir, req.file.filename);
    const resizedFilename = `resized-${req.file.filename}`;
    const outputPath = path.join(uploadDir, resizedFilename);

    // Resize and compress the image
    await sharp(inputPath)
      .resize(256, 256, {
        fit: "cover", // crop and fill to exact dimensions
        position: "centre", // (British spelling used by sharp)
      })
      .jpeg({ quality: 80 }) // or .png({ quality: 80 })
      .toFile(outputPath);

    // Optionally delete the original full-size upload
    fs.unlinkSync(inputPath);

    const filePath = `/uploads/${resizedFilename}`;
    res.json({ message: "Upload successful", path: filePath });
  } catch (err) {
    console.error("❌ Image processing failed:", err);
    res.status(500).json({ error: "Failed to process image" });
  }
});


app.post("/api/tierlists", async (req: Request<{}, {}, Prisma.TierListCreateInput>, res: Response) => {
  const { title, description, visibility = "private", tiers = [] } = req.body as {
    title: string;
    description?: string;
    visibility?: string;
    tiers: {
      name: string;
      order: number;
      items: { name: string; description?: string; imageUrl?: string }[];
    }[];
  };

  if (!title || !tiers.length) {
    return res.status(400).json({ error: "Tier list must have a title and tiers." });
  }

  try {
    const newTierList = await prisma.tierList.create({
      data: {
        title,
        description: description ?? null,
        visibility,
        tiers: {
          create: tiers.map((tier) => ({
            name: tier.name,
            order: tier.order,
            items: {
              create: tier.items.map((item) => ({
                name: item.name,
                description: item.description ?? null,
                imageUrl: item.imageUrl ?? null,
              })),
            },
          })),
        } as Prisma.TierCreateNestedManyWithoutTierListInput,
      },
      include: { tiers: { include: { items: true } } },
    });

    console.log("✅ New Tier List created:", newTierList.id);
    res.json(newTierList);
  } catch (err) {
    console.error("❌ Error creating tier list:", err);
    res.status(500).json({ error: "Failed to create tier list" });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
