// dragUtils.ts
import type { Card, Tier } from "../components/TierListEditor";

export interface DragState {
  from: "cards" | "tier";
  tierId?: string;
  card: Card;
}

export interface DragPreview {
  tierId: string;           // "cards" for unsorted, or tier.id
  targetCardId?: string;    // card ID to drop before/after
  before?: boolean;
}

/** Remove the dragged card from all tiers */
export function removeCardFromTiers(
  tiers: Tier[],
  cardId: string
): Tier[] {
  return tiers.map((tier) => ({
    ...tier,
    items: tier.items.filter((i) => i.id !== cardId),
  }));
}

/** Insert a card into a tier at the right spot */
export function insertCardIntoTier(
  tiers: Tier[],
  targetTierId: string,
  card: Card,
  targetCardId?: string,
  before?: boolean
): Tier[] {
  return tiers.map((tier) => {
    if (tier.id !== targetTierId) return tier;
    const items = [...tier.items];
    const existingIdx = items.findIndex((i) => i.id === card.id);
    if (existingIdx !== -1) items.splice(existingIdx, 1); // ensure removed first

    if (targetCardId) {
      const idx = items.findIndex((i) => i.id === targetCardId);
      const insertAt = before ? idx : idx + 1;
      items.splice(insertAt, 0, card);
    } else {
      items.push(card);
    }
    return { ...tier, items };
  });
}

/** Move a card from source to target (general purpose handler) */
export function moveCardBetween(
  tiers: Tier[],
  cards: Card[],
  dragging: DragState,
  targetTierId?: string
): { tiers: Tier[]; cards: Card[] } {
  let newTiers = removeCardFromTiers(tiers, dragging.card.id);
  let newCards = [...cards];

  if (targetTierId === "cards") {
    // move to unsorted
    if (!newCards.some((c) => c.id === dragging.card.id))
      newCards.push(dragging.card);
  } else if (targetTierId) {
    // move to a tier
    newTiers = insertCardIntoTier(newTiers, targetTierId, dragging.card);
    newCards = newCards.filter((c) => c.id !== dragging.card.id);
  }

  return { tiers: newTiers, cards: newCards };
}

/** Disable browser ghost drag image */
export function suppressDefaultDragImage(e: React.DragEvent) {
  const empty = document.createElement("div");
  e.dataTransfer?.setDragImage(empty, 0, 0);
}
