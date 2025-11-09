import React, { useMemo, useState } from "react";
import {
  removeCardFromTiers,
  insertCardIntoTier,
  moveCardBetween,
  suppressDefaultDragImage,
  type DragState,
} from "../../utils/dragUtils";
import { getColorByIndex } from "./constants";
import type { Card, Tier } from "./types";
import TierRow from "./TierRow";
import TierSettingsModal from "./TierSettingsModal";

function makeId(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function TierListEditor() {
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
    ].map((src) => ({ id: makeId("card"), src: src, name: "Default Name" }))
  );

  const [tiers, setTiers] = useState<Tier[]>(() =>
    ["S", "A", "B", "C", "D"].map((label, i) => ({
      id: makeId("tier"),
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
      const newTier: Tier = { id: makeId("tier"), label, color, items: [], isUnsorted: false };
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
    // console.log(`target: ${target?.getHTML()}`);

    const draggedImage = document.querySelector(".dragging") as HTMLElement | null;

    if (!ghost || !target || !draggedImage) return;

    if (target.tagName === "IMG" && target !== draggedImage) {
      const { left, width } = target.getBoundingClientRect();
      const mid = left + width / 2;

      const container = target.closest(".items");
      // console.log(`container: ${container?.getHTML()}`);

      if (container && ghost.parentElement !== container) container.appendChild(ghost);

      if (e.clientX < mid) target.before(ghost);
      else target.after(ghost);
    } else if (target.classList.contains("items")) {
      target.appendChild(ghost);
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

    const { tiers: newTiers, cards: newCards } = moveCardBetween(
      tiers,
      cards,
      dragging,
      tierId
    );
    setTiers(newTiers);
    setCards(newCards);
    endDrag();
  };

  const dropOnCard = (tierId: string, targetCardId: string, e: React.DragEvent) => {
    e.preventDefault();
    if (!dragging) return;

    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const before = e.clientX < rect.left + rect.width / 2;

    // special case: unsorted pseudo-tier
    if (tierId === "cards") {
      // remove from any tier it might have been in
      const newTiers = removeCardFromTiers(tiers, dragging.card.id);

      // start from cards but remove the dragged one
      let newCards = cards.filter((c) => c.id !== dragging.card.id);

      // find where to insert relative to the target card
      const targetIdx = newCards.findIndex((c) => c.id === targetCardId);
      if (targetIdx === -1) {
        // if somehow we didn't find it, just push
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

    // normal tier-to-tier logic
    let newTiers = removeCardFromTiers(tiers, dragging.card.id);
    newTiers = insertCardIntoTier(newTiers, tierId, dragging.card, targetCardId, before);
    setTiers(newTiers);

    // if it came from unsorted, remove it from cards
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
