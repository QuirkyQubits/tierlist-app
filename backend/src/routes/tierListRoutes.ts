import express from "express";
import { auth, type AuthRequest } from "../auth.js";
import { prisma } from "../utils/prisma.js";

const router = express.Router();


router.post("/new-tierlist", auth, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const { title, description, visibility = "PRIVATE", tiers = [] } = req.body;

  if (!title || !tiers.length)
    return res
      .status(400)
      .json({ error: "Tier list must have a title and tiers." });

  console.log("🧾 Incoming payload:", JSON.stringify(req.body, null, 2));

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
            color: tier.color,
            order: tier.order,
            items: {
              create: (tier.items || []).map((item: any) => ({
                name: item.name,
                imageUrl: item.imageUrl,
              })),
            },
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


router.get("/my-tierlists", auth, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const lists = await prisma.tierList.findMany({
    where: { userId },
    include: { tiers: { include: { items: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(lists);
});


router.get("/public", async (_, res) => {
  const lists = await prisma.tierList.findMany({
    where: { visibility: "PUBLIC" },
    include: { tiers: { include: { items: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(lists);
});


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


router.put("/:id", auth, async (req: AuthRequest, res) => {
  const tierListId = Number(req.params.id);
  const { title, tiers, deletedItemIds } = req.body;
  const userId = req.user!.userId;

  try {
    // 1Verify that the tier list belongs to this user
    const existing = await prisma.tierList.findUnique({
      where: { id: tierListId },
      include: { tiers: { include: { items: true } } },
    });

    if (!existing || existing.userId !== userId)
      return res.status(403).json({ error: "Unauthorized or not found" });

    // Process deleted items
    if (deletedItemIds?.length) {
      await prisma.tierItem.deleteMany({
        where: { id: { in: deletedItemIds } },
      });
    }

    // Update title (and any TierList-level fields)
    await prisma.tierList.update({
      where: { id: tierListId },
      data: { title },
    });

    // Loop through tiers in the payload
    for (const tier of tiers) {
      let tierRecord;

      if (tier.id) {
        // Existing tier: update label/color/order if changed
        tierRecord = await prisma.tier.update({
          where: { id: tier.id },
          data: {
            name: tier.name,
            color: tier.color,
            order: tier.order,
          },
        });
      } else {
        // New tier: create it
        tierRecord = await prisma.tier.create({
          data: {
            name: tier.name,
            color: tier.color,
            order: tier.order,
            tierListId,
          },
        });
      }

      // Loop through items for this tier
      for (const item of tier.items) {
        if (!item.id) {
          // 🆕 Create new item
          await prisma.tierItem.create({
            data: {
              name: item.name,
              imageUrl: item.imageUrl,
              tierId: tierRecord.id,
            },
          });
        } else {
          // Update existing item (only if changed)
          const existingItem = existing.tiers
            .flatMap((t) => t.items)
            .find((i) => i.id === item.id);

          if (
            existingItem &&
            (existingItem.name !== item.name ||
              existingItem.imageUrl !== item.imageUrl ||
              existingItem.tierId !== tierRecord.id)
          ) {
            await prisma.tierItem.update({
              where: { id: item.id },
              data: {
                name: item.name,
                imageUrl: item.imageUrl,
                tierId: tierRecord.id,
              },
            });
          }
        }
      }
    }

    // Return the fully updated tier list
    const updated = await prisma.tierList.findUnique({
      where: { id: tierListId },
      include: { tiers: { include: { items: true } } },
    });

    res.json(updated);
  } catch (err) {
    console.error("❌ Failed to update tier list:", err);
    res.status(500).json({ error: "Failed to update tier list" });
  }
});



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
