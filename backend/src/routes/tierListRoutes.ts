import express from "express";
import { auth, type AuthRequest } from "../auth.js";
import { prisma } from "../utils/prisma.js";

const router = express.Router();

// Create a new tier list (requires auth)
router.post("/new-tierlist", auth, async (req: AuthRequest, res) => {
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


// Get current user's tier lists
router.get("/my-tierlists", auth, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const lists = await prisma.tierList.findMany({
    where: { userId },
    include: { tiers: { include: { items: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(lists);
});


// Public lists
router.get("/public", async (_, res) => {
  const lists = await prisma.tierList.findMany({
    where: { visibility: "PUBLIC" },
    include: { tiers: { include: { items: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(lists);
});


// Get single tier list (public or owned)
router.get("/:id", auth, async (req: AuthRequest, res) => {
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
router.delete("/:id", auth, async (req: AuthRequest, res) => {
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


export default router;
