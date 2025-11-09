import express from "express";
import { auth, type AuthRequest } from "../auth.js";
import { prisma } from "../utils/prisma.js";

const router = express.Router();


router.post("/", auth, async (req: AuthRequest, res) => {
  const { name, imageUrl, tierId } = req.body;

  if (!name || !imageUrl || !tierId)
    return res.status(400).json({ error: "Missing required fields" });

  try {
    const created = await prisma.tierItem.create({
      data: {
        name,
        imageUrl,
        tier: { connect: { id: tierId } },
      },
    });
    res.status(201).json(created);
  } catch (err) {
    console.error("❌ Failed to create tier item:", err);
    res.status(500).json({ error: "Failed to create tier item" });
  }
});


router.put("/:id", auth, async (req: AuthRequest, res) => {
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


router.delete("/:id", auth, async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  try {
    await prisma.tierItem.delete({ where: { id } });
    res.json({ message: "Tier item deleted" });
  } catch (err) {
    console.error("❌ Failed to delete tier item:", err);
    res.status(500).json({ error: "Failed to delete tier item" });
  }
});


export default router;