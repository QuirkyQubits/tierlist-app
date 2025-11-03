import express from "express";
import { auth, type AuthRequest } from "../auth.js";
import { prisma } from "../utils/prisma.js";

const router = express.Router();


router.get("/:id", async (req, res) => {
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