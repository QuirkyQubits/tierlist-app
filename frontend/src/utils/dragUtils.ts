// dragUtils.ts
import type { Card, Tier } from "../components/TierListEditor/types";

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
  tierId: string,
  card: Card,
  targetCardId: string,
  before: boolean
): Tier[] {
  // Unsorted zone should not modify tiers
  if (tierId === "cards") return tiers;

  const copy = tiers.map((t) => {
    if (t.id !== tierId) return t;

    const items = [...t.items];
    const targetIdx = items.findIndex((c) => c.id === targetCardId);
    if (targetIdx === -1) return t;

    const insertAt = before ? targetIdx : targetIdx + 1;
    items.splice(insertAt, 0, card);
    return { ...t, items };
  });

  return copy;
}


/** Move a card from source to target (general purpose handler) */
export function moveCardBetween(
  tiers: Tier[],
  cards: Card[],
  dragging: DragState,
  targetTierId: string
): { tiers: Tier[]; cards: Card[] } {
  const { from, card } = dragging;

  // Start by removing the card from any tier
  let newTiers = removeCardFromTiers(tiers, card.id);
  let newCards = [...cards];

  // If the card came from the unsorted zone, remove it there too
  if (from === "cards") {
    newCards = newCards.filter((c) => c.id !== card.id);
  }

  // Now decide where to put it
  if (targetTierId === "cards") {
    // Dropped into unsorted zone
    newCards.push(card);
  } else {
    // Dropped into a regular tier
    const targetIdx = newTiers.findIndex((t) => t.id === targetTierId);
    if (targetIdx !== -1) {
      const updatedTier = {
        ...newTiers[targetIdx],
        items: [...newTiers[targetIdx].items, card],
      };
      newTiers[targetIdx] = updatedTier;
    }
  }

  return { tiers: newTiers, cards: newCards };
}


/** Disable browser ghost drag image */
export function suppressDefaultDragImage(e: React.DragEvent) {
  const empty = document.createElement("div");
  e.dataTransfer?.setDragImage(empty, 0, 0);
}
