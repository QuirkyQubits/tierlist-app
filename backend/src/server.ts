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

app.post(
  "/api/tierlists",
  async (req: Request<{}, {}, Prisma.TierListCreateInput>, res: Response) => {
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
      return res
        .status(400)
        .json({ error: "Tier list must have a title and tiers." });
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
  }
);

// Get all public tier lists
app.get("/api/tierlists", async (req, res) => {
  try {
    const tierLists = await prisma.tierList.findMany({
      where: { visibility: "public" },
      include: { tiers: { include: { items: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(tierLists);
  } catch (err) {
    console.error("❌ Failed to fetch tier lists:", err);
    res.status(500).json({ error: "Failed to fetch tier lists" });
  }
});

// Get a single tier list by ID
app.get("/api/tierlists/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    const tierList = await prisma.tierList.findUnique({
      where: { id },
      include: { tiers: { include: { items: true } } },
    });
    if (!tierList)
      return res.status(404).json({ error: "Tier list not found" });
    res.json(tierList);
  } catch (err) {
    console.error("❌ Failed to fetch tier list:", err);
    res.status(500).json({ error: "Failed to fetch tier list" });
  }
});

// Update a tier list
app.put("/api/tierlists/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { title, description, visibility } = req.body;

  try {
    const updated = await prisma.tierList.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(visibility && { visibility }),
      },
    });

    res.json(updated);
  } catch (err) {
    console.error("❌ Failed to update tier list:", err);
    res.status(500).json({ error: "Failed to update tier list" });
  }
});

// Delete a tier list and its tiers/items
app.delete("/api/tierlists/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    // Manual cascade delete
    await prisma.tierItem.deleteMany({
      where: { tier: { tierListId: id } },
    });
    await prisma.tier.deleteMany({ where: { tierListId: id } });
    await prisma.tierList.delete({ where: { id } });

    res.json({ message: "Tier list deleted" });
  } catch (err) {
    console.error("❌ Failed to delete tier list:", err);
    res.status(500).json({ error: "Failed to delete tier list" });
  }
});

// Get a tier item
app.get("/api/items/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    const item = await prisma.tierItem.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ error: "Tier item not found" });
    res.json(item);
  } catch (err) {
    console.error("❌ Failed to fetch tier item:", err);
    res.status(500).json({ error: "Failed to fetch tier item" });
  }
});

// Update a tier item
app.put("/api/items/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { name, description, imageUrl, tierId } = req.body;

  try {
    const updated = await prisma.tierItem.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(imageUrl && { imageUrl }),
        ...(tierId && { tier: { connect: { id: tierId } } }),
      },
    });

    res.json(updated);
  } catch (err) {
    console.error("❌ Failed to update tier item:", err);
    res.status(500).json({ error: "Failed to update tier item" });
  }
});

// Delete a tier item
app.delete("/api/items/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    await prisma.tierItem.delete({ where: { id } });
    res.json({ message: "Tier item deleted" });
  } catch (err) {
    console.error("❌ Failed to delete tier item:", err);
    res.status(500).json({ error: "Failed to delete tier item" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
