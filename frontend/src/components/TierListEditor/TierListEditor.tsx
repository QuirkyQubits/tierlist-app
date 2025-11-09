import React, { useMemo, useState } from "react";
import { getColorByIndex } from "./constants";
import type { Card, Tier } from "./types";
import TierRow from "./TierRow";
import TierSettingsModal from "./TierSettingsModal";

interface DragState {
  from: "cards" | "tier";
  tierId?: string;
  card: Card;
}

/** Remove the dragged card from all tiers */
function removeCardFromTiers(
  tiers: Tier[],
  cardId: string
): Tier[] {
  return tiers.map((tier) => ({
    ...tier,
    items: tier.items.filter((i) => i.id !== cardId),
  }));
}

/** Insert a card into a tier at the right spot */
function insertCardIntoTier(
  tiers: Tier[],
  tierId: string,
  card: Card,
  targetCardId?: string,
  before = true
): Tier[] {
  return tiers.map((tier) => {
    if (tier.id !== tierId) return tier;

    const items = [...tier.items];
    const targetIndex = targetCardId
      ? items.findIndex((i) => i.id === targetCardId)
      : -1;

    if (targetIndex === -1) {
      // append at the end
      items.push(card);
    } else {
      // insert before or after the found card
      const insertAt = before ? targetIndex : targetIndex + 1;
      items.splice(insertAt, 0, card);
    }

    return { ...tier, items };
  });
}

/** Disable browser ghost drag image */
function suppressDefaultDragImage(e: React.DragEvent) {
  const empty = document.createElement("div");
  e.dataTransfer?.setDragImage(empty, 0, 0);
}

export default function TierListEditor() {
  const nextCardId = React.useRef(1);
  const nextTierId = React.useRef(1);

  const [cards, setCards] = useState<Card[]>(() =>
    [
      "https://placehold.co/100/orange/fff",
      "https://placehold.co/200/dodgerblue/fff",
      "https://placehold.co/150x100/green/fff",
      "https://placehold.co/120x150/red/fff",
      "https://placehold.co/220x190/purple/fff",
      "https://placehold.co/300x120/teal/fff",
      "https://placehold.co/145/pink/fff",
      "https://placehold.co/90/hotpink/fff",
      "https://placehold.co/145/brown/fff",
      "https://placehold.co/110x165/darkorchid/fff",
      "https://placehold.co/220/bisque/fff",
      "https://placehold.co/135x150/lightseagreen/fff",
    ].map((src) => ({
      id: String(nextCardId.current++),
      src: src,
      name: "<name>"
    }))
  );

  const [tiers, setTiers] = useState<Tier[]>(() =>
    ["S", "A", "B", "C", "D"].map((label, i) => ({
      id: String(nextTierId.current++),
      label,
      color: getColorByIndex(i),
      items: [],
      isUnsorted: false,
    }))
  );

  const [activeTierId, setActiveTierId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingLabel, setEditingLabel] = useState("");
  const [dragging, setDragging] = useState<DragState | null>(null);

  const activeTier = useMemo(
    () => tiers.find((t) => t.id === activeTierId) ?? null,
    [activeTierId, tiers]
  );

  // ---------------- Tier actions ----------------
  const openSettings = (tier: Tier) => {
    setActiveTierId(tier.id);
    setEditingLabel(tier.label);
    setIsSettingsOpen(true);
  };
  const closeSettings = () => {
    setIsSettingsOpen(false);
    setActiveTierId(null);
  };

  const addTier = (label = "Change me", insertIndex?: number) =>
    setTiers((prev) => {
      const color = getColorByIndex(prev.length);
      const newTier: Tier = { id: String(nextTierId.current++), label, color, items: [], isUnsorted: false };
      const copy = [...prev];
      insertIndex != null ? copy.splice(insertIndex, 0, newTier) : copy.push(newTier);
      return copy;
    });

  const deleteTier = () => {
    if (!activeTier) return;
    setCards((p) => [...p, ...activeTier.items]);
    setTiers((p) => p.filter((t) => t.id !== activeTier.id));
    closeSettings();
  };

  const clearTier = () => {
    if (!activeTier) return;
    setCards((p) => [...p, ...activeTier.items]);
    setTiers((p) =>
      p.map((t) => (t.id === activeTier.id ? { ...t, items: [] } : t))
    );
    closeSettings();
  };

  const moveTier = (id: string, dir: "up" | "down") =>
    setTiers((p) => {
      const i = p.findIndex((t) => t.id === id);
      if (i === -1) return p;
      const j = dir === "up" ? i - 1 : i + 1;
      if (j < 0 || j >= p.length) return p;
      const copy = [...p];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  // --- position ghost logic ---
  function positionGhost(e: DragEvent) {
    const ghost = document.querySelector(".drag-ghost") as HTMLElement | null;
    const target = e.target as HTMLElement | null;
    const draggedImage = document.querySelector(".dragging") as HTMLElement | null;

    if (!ghost || !target || !draggedImage) return;

    // If we're hovering over part of a TierItem (img, text, etc.)
    const itemContainer = target.closest(".tier-item") as HTMLElement | null;
    if (itemContainer && itemContainer !== draggedImage) {
      // Ignore if this is the ghost itself
      if (itemContainer.classList.contains("drag-ghost")) return;

      const { left, width } = itemContainer.getBoundingClientRect();
      const mid = left + width / 2;

      const container = itemContainer.closest(".items");
      if (!container) return;

      // Ensure the ghost is in the same container
      if (ghost.parentElement !== container) container.appendChild(ghost);

      const insertBefore = e.clientX < mid;

      // Prevent flicker: only move ghost if its position actually changes
      if (insertBefore && ghost.nextElementSibling !== itemContainer) {
        itemContainer.before(ghost);
      } else if (!insertBefore && ghost.previousElementSibling !== itemContainer) {
        itemContainer.after(ghost);
      }

      return;
    }

    // If hovering over an empty tier area
    if (target.classList.contains("items")) {
      if (ghost.parentElement !== target) target.appendChild(ghost);
    }
  }



  // ---------------- Drag logic ----------------
  const beginDrag = (
    from: "cards" | "tier",
    tierId: string | undefined,
    card: Card,
    e: React.DragEvent
  ) => {
    setDragging({ from, tierId, card });
    suppressDefaultDragImage(e);

    const item = e.currentTarget as HTMLElement;
    item.classList.add("dragging");

    const ghost = item.cloneNode(true) as HTMLElement;
    ghost.classList.add("drag-ghost");
    ghost.classList.remove("dragging");
    ghost.style.opacity = "0.25";
    ghost.style.pointerEvents = "none";

    document.body.appendChild(ghost);
  };

  const endDrag = () => {
    setDragging(null);
    document.querySelector(".drag-ghost")?.remove();
    document.querySelector(".dragging")?.classList.remove("dragging");
  };

  const handleDragOverTier = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragging) positionGhost(e.nativeEvent);
  };

  const handleDragOverCard = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragging) positionGhost(e.nativeEvent);
  };

  const dropOnTier = (tierId: string) => {
    if (!dragging) return;

    // Special case: unsorted pseudo-tier
    if (tierId === "cards") {
      const ghost = document.querySelector(".drag-ghost") as HTMLElement | null;
      const container = ghost?.parentElement;
      if (!ghost || !container) return;

      // Find the next sibling card (if any)
      const next = ghost.nextElementSibling as HTMLElement | null;
      const nextCardId = next?.dataset?.cardId || undefined;

      // Remove from all tiers
      const newTiers = removeCardFromTiers(tiers, dragging.card.id);

      // Insert into unsorted cards
      let newCards = cards.filter((c) => c.id !== dragging.card.id);

      if (nextCardId) {
        const idx = newCards.findIndex((c) => c.id === nextCardId);
        newCards.splice(idx, 0, dragging.card);
      } else {
        newCards.push(dragging.card);
      }

      setTiers(newTiers);
      setCards(newCards);
      endDrag();
      return;
    }

    // Normal tier logic below
    const ghost = document.querySelector(".drag-ghost") as HTMLElement | null;
    const container = ghost?.parentElement;
    if (!ghost || !container) return;

    const next = ghost.nextElementSibling as HTMLElement | null;
    const nextCardId = next?.dataset?.cardId || undefined;

    let newTiers = removeCardFromTiers(tiers, dragging.card.id);
    newTiers = insertCardIntoTier(newTiers, tierId, dragging.card, nextCardId, true);
    setTiers(newTiers);

    if (dragging.from === "cards") {
      setCards((p) => p.filter((c) => c.id !== dragging.card.id));
    }

    endDrag();
  };

  const dropOnCard = (tierId: string, targetCardId: string, e: React.DragEvent) => {
    e.preventDefault();
    if (!dragging) return;

    const itemContainer = e.currentTarget as HTMLElement;
    const rect = itemContainer.getBoundingClientRect();
    const before = e.clientX < rect.left + rect.width / 2;

    // --- unsorted / "cards" pseudo-tier ---
    if (tierId === "cards") {
      // remove from any tier
      const newTiers = removeCardFromTiers(tiers, dragging.card.id);

      // start from current cards but remove the dragged one
      let newCards = cards.filter((c) => c.id !== dragging.card.id);

      // find the card we dropped on
      const targetIdx = newCards.findIndex((c) => c.id === targetCardId);

      if (targetIdx === -1) {
        // if for some reason we can't find it, fall back to push
        newCards.push(dragging.card);
      } else {
        const insertAt = before ? targetIdx : targetIdx + 1;
        newCards.splice(insertAt, 0, dragging.card);
      }

      setTiers(newTiers);
      setCards(newCards);
      endDrag();
      return;
    }

    // --- normal tier-to-tier case ---
    let newTiers = removeCardFromTiers(tiers, dragging.card.id);
    newTiers = insertCardIntoTier(newTiers, tierId, dragging.card, targetCardId, before);
    setTiers(newTiers);

    // if we dragged from unsorted, remove it there too
    if (dragging.from === "cards") {
      setCards((p) => p.filter((c) => c.id !== dragging.card.id));
    }

    endDrag();
  };

  const handleDeleteCard = (tierId: string | undefined, cardId: string) => {
    if (tierId) {
      // Delete from tier
      setTiers((prev) =>
        prev.map((t) =>
          t.id === tierId ? { ...t, items: t.items.filter((c) => c.id !== cardId) } : t
        )
      );
    } else {
      // Delete from unsorted
      setCards((prev) => prev.filter((c) => c.id !== cardId));
    }
  };

  const handleRenameCard = (tierId: string | undefined, cardId: string, newName: string) => {
    if (tierId) {
      setTiers((prev) =>
        prev.map((t) =>
          t.id === tierId
            ? { ...t, items: t.items.map((c) => (c.id === cardId ? { ...c, name: newName } : c)) }
            : t
        )
      );
    } else {
      setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, name: newName } : c)));
    }
  };


  // ---------------- Render ----------------
  return (
    <div className="min-h-screen bg-zinc-900 text-white flex flex-col gap-4 p-4">
      <h1
        className="text-2xl font-bold cursor-pointer"
        onClick={() => addTier()}
      >
        TierList Maker
      </h1>

      {/* Tier rows */}
      <div className="w-full border border-zinc-800 rounded bg-zinc-800/40">
        {tiers.map((tier) => (
          <TierRow
            key={tier.id}
            tier={tier}
            onOpenSettings={openSettings}
            onMoveTier={moveTier}
            beginDrag={beginDrag}
            endDrag={endDrag}
            handleDragOverTier={handleDragOverTier}
            handleDragOverCard={handleDragOverCard}
            dropOnTier={dropOnTier}
            dropOnCard={dropOnCard}
            onDelete={handleDeleteCard}
            onRename={handleRenameCard}
          />
        ))}
      </div>

      {/* --- Unsorted zone as pseudo-tier --- */}
      <div className="mt-6">
        <TierRow
          key="unsorted"
          tier={{
            id: "cards",
            label: "Unsorted",
            color: "transparent",
            items: cards,
            isUnsorted: true,
          }}
          onOpenSettings={() => {}}
          onMoveTier={() => {}}
          beginDrag={beginDrag}
          endDrag={endDrag}
          handleDragOverTier={handleDragOverTier}
          handleDragOverCard={handleDragOverCard}
          dropOnTier={dropOnTier}
          dropOnCard={dropOnCard}
          onDelete={handleDeleteCard}
          onRename={handleRenameCard}
        />
      </div>

      {/* Settings modal */}
      {isSettingsOpen && activeTier && (
        <TierSettingsModal
          tier={activeTier}
          tiers={tiers}
          editingLabel={editingLabel}
          setEditingLabel={setEditingLabel}
          setTiers={setTiers}
          activeTierId={activeTierId!}
          addTier={addTier}
          deleteTier={deleteTier}
          clearTier={clearTier}
          closeSettings={closeSettings}
        />
      )}
    </div>
  );
}
