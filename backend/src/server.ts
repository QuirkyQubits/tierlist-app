import express, { type Request, type Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient, type Prisma } from "@prisma/client";
import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { auth, type AuthRequest } from "./auth.js";

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// -------------------- File Upload Setup --------------------
const uploadDir = path.join(process.cwd(), "src/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use("/uploads", express.static(uploadDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});
const upload = multer({ storage });

// -------------------- Basic Root Route --------------------
app.get("/", (req: Request, res: Response) => {
  res.send("Tierlist backend is running 🚀 (TypeScript + PostgreSQL + Prisma)");
});

// -------------------- Auth Routes (Phase 3) --------------------

// Register new user
app.post("/api/register", async (req, res) => {
  const { email, password, username } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Missing fields" });

  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashed, username },
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });

    res.json({ token, user });
  } catch (err) {
    console.error("❌ Registration error:", err);
    res.status(400).json({ error: "Email already exists" });
  }
});

// Login existing user
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Missing credentials" });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });

  res.json({ token, user });
});

// -------------------- File Upload --------------------
app.post("/api/upload", upload.single("image"), async (req, res) => {
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

// -------------------- TierList CRUD (Phase 4) --------------------

// Create a new tier list (requires auth)
app.post("/api/tierlists", auth, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const { title, description, visibility = "PRIVATE", tiers = [] } = req.body;

  if (!title || !tiers.length)
    return res
      .status(400)
      .json({ error: "Tier list must have a title and tiers." });

  try {
    const newTierList = await prisma.tierList.create({
      data: {
        title,
        description: description ?? null,
        visibility,
        userId,
        tiers: {
          create: tiers.map((tier: any) => ({
            name: tier.name,
            order: tier.order,
            items: { create: tier.items || [] },
          })),
        },
      },
      include: { tiers: { include: { items: true } } },
    });

    res.json(newTierList);
  } catch (err) {
    console.error("❌ Error creating tier list:", err);
    res.status(500).json({ error: "Failed to create tier list" });
  }
});

// Get all tier lists for current logged-in user
app.get("/api/my-tierlists", auth, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;

  try {
    const lists = await prisma.tierList.findMany({
      where: { userId },
      include: { tiers: { include: { items: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(lists);
  } catch (err) {
    console.error("❌ Failed to fetch user tier lists:", err);
    res.status(500).json({ error: "Failed to fetch user tier lists" });
  }
});

// Get all public tier lists
app.get("/api/public-tierlists", async (req, res) => {
  try {
    const lists = await prisma.tierList.findMany({
      where: { visibility: "PUBLIC" },
      include: { tiers: { include: { items: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(lists);
  } catch (err) {
    console.error("❌ Failed to fetch public tier lists:", err);
    res.status(500).json({ error: "Failed to fetch public tier lists" });
  }
});

// Get single tier list (public or owned)
app.get("/api/tierlists/:id", auth, async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const userId = req.user!.userId;

  try {
    const tierList = await prisma.tierList.findUnique({
      where: { id },
      include: { tiers: { include: { items: true } } },
    });
    if (!tierList)
      return res.status(404).json({ error: "Tier list not found" });

    if (
      tierList.visibility === "PRIVATE" &&
      tierList.userId !== userId
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json(tierList);
  } catch (err) {
    console.error("❌ Failed to fetch tier list:", err);
    res.status(500).json({ error: "Failed to fetch tier list" });
  }
});

// Delete a tier list (owner only)
app.delete("/api/tierlists/:id", auth, async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const userId = req.user!.userId;

  try {
    const tierList = await prisma.tierList.findUnique({ where: { id } });
    if (!tierList)
      return res.status(404).json({ error: "Tier list not found" });
    if (tierList.userId !== userId)
      return res.status(403).json({ error: "Access denied" });

    await prisma.tierList.delete({ where: { id } });
    res.json({ message: "Tier list deleted" });
  } catch (err) {
    console.error("❌ Failed to delete tier list:", err);
    res.status(500).json({ error: "Failed to delete tier list" });
  }
});

// -------------------- TierItem CRUD (unchanged) --------------------
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

// -------------------- Start Server --------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
