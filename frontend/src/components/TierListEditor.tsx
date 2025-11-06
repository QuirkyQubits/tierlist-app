import React, { useMemo, useState } from "react";
import {
  removeCardFromTiers,
  insertCardIntoTier,
  moveCardBetween,
  suppressDefaultDragImage,
  type DragState,
} from "../utils/dragUtils";

export type Card = { id: string; src: string };
export type Tier = { id: string; label: string; color: string; items: Card[] };

const COLORS = [
  "#FF7F7F",
  "#FFBF7F",
  "#FFDF7F",
  "#FFFF7F",
  "#BFFF7F",
  "#7FFF7F",
  "#7FFFFF",
  "#7FBFFF",
  "#7F7FFF",
  "#BF7FFF",
  "#FF7FFF",
  "#FF7FBF",
  "#BFBFBF",
  "#CFCFCF",
];

function makeId(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}


function positionGhost(e: DragEvent, draggingCardId?: string) {
  const ghost = document.querySelector(".drag-ghost") as HTMLElement | null;
  const target = e.target as HTMLElement | null;
  const draggedImage = document.querySelector(".dragging") as HTMLElement | null;

  if (!ghost || !target || !draggedImage) return;

  // --- dragging over a valid card
  if (target.tagName === "IMG" && target !== draggedImage) {
    const { left, width } = target.getBoundingClientRect();
    const mid = left + width / 2;

    // ensure ghost is inside same container
    const container = target.closest(".items");
    if (container && ghost.parentElement !== container) {
      container.appendChild(ghost);
    }

    if (e.clientX < mid) {
      target.before(ghost);
    } else {
      target.after(ghost);
    }
  }

  // --- dragging over an empty zone
  else if (target.classList.contains("items")) {
    target.appendChild(ghost);
  }

  // --- dragging over itself → do nothing (no ghost move)
  // implicit since we skip if target === draggedImage
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
    ].map((src) => ({ id: makeId("card"), src }))
  );

  const [tiers, setTiers] = useState<Tier[]>(() =>
    ["S", "A", "B", "C", "D"].map((label, i) => ({
      id: makeId("tier"),
      label,
      color: COLORS[i % COLORS.length],
      items: [],
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

  // --------------- tier CRUD ---------------
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
      const color = COLORS[prev.length % COLORS.length];
      const newTier: Tier = { id: makeId("tier"), label, color, items: [] };
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
    setTiers((p) => p.map((t) => (t.id === activeTier.id ? { ...t, items: [] } : t)));
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

  // --------------- drag logic ---------------
const beginDrag = (
  from: "cards" | "tier",
  tierId: string | undefined,
  card: Card,
  e: React.DragEvent
) => {
  setDragging({ from, tierId, card });
  suppressDefaultDragImage(e);

  // Mark the actual image being dragged (for comparison later)
  const img = e.currentTarget as HTMLElement;
  img.classList.add("dragging");

  // Create a translucent "ghost" element used for preview positioning
  const ghost = document.createElement("img");
  ghost.src = card.src;
  ghost.className =
    "drag-ghost w-20 h-20 object-cover rounded border border-zinc-600 opacity-25 pointer-events-none";
  document.body.appendChild(ghost);
};

const endDrag = () => {
  setDragging(null);

  // Clean up both helper elements
  document.querySelector(".drag-ghost")?.remove();
  document.querySelector(".dragging")?.classList.remove("dragging");
};


  // tier background
  const handleDragOverTier = (tierId: string, e: React.DragEvent) => {
    e.preventDefault();
    if (!dragging) return;
    positionGhost(e.nativeEvent, dragging.card.id);
  };

  // specific card in tier
  const handleDragOverCard = (tierId: string, targetId: string, e: React.DragEvent) => {
    e.preventDefault();
    if (!dragging) return;
    positionGhost(e.nativeEvent, dragging.card.id);
  };

  const dropOnCard = (tierId: string, targetCardId: string, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragging) return;

    // if we dropped on ourselves -> no-op
    if (dragging.from === "tier" && dragging.tierId === tierId && dragging.card.id === targetCardId) {
      endDrag();
      return;
    }

    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const mid = rect.left + rect.width / 2;
    const before = e.clientX < mid;

    // remove from original place
    let newTiers = removeCardFromTiers(tiers, dragging.card.id);
    // insert at correct place
    newTiers = insertCardIntoTier(newTiers, tierId, dragging.card, targetCardId, before);
    setTiers(newTiers);

    // if came from unsorted, remove there
    if (dragging.from === "cards") {
      setCards((p) => p.filter((c) => c.id !== dragging.card.id));
    }

    endDrag();
  };

  const dropOnTier = (tierId: string) => {
    if (!dragging) return;

    // if we are dragging inside same tier and we are already the last item -> no-op
    if (dragging.from === "tier" && dragging.tierId === tierId) {
      const tier = tiers.find((t) => t.id === tierId);
      if (tier && tier.items[tier.items.length - 1]?.id === dragging.card.id) {
        endDrag();
        return;
      }
    }

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

  // unsorted whole area
  const dropOnUnsorted = () => {
    if (!dragging) return;

    // if dragging from cards and it's already last, do nothing
    if (dragging.from === "cards") {
      if (cards.length && cards[cards.length - 1].id === dragging.card.id) {
        endDrag();
        return;
      }
    }

    const { tiers: newTiers, cards: newCards } = moveCardBetween(
      tiers,
      cards,
      dragging,
      "cards"
    );
    setTiers(newTiers);
    setCards(newCards);
    endDrag();
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold cursor-pointer" onClick={() => addTier()}>
        TierList Maker
      </h1>

      {/* tiers */}
      <div className="w-full border border-zinc-800 rounded bg-zinc-800/40">
        {tiers.map((tier) => (
          <div key={tier.id} className="flex border-b border-zinc-900 last:border-none">
            <div
              className="w-28 flex items-center justify-center font-semibold text-sm"
              style={{ backgroundColor: tier.color }}
            >
              {tier.label}
            </div>

            <div
              className="items flex flex-wrap gap-2 flex-1 min-h-[90px] p-2"
              onDragOver={(e) => handleDragOverTier(tier.id, e)}
              onDrop={() => dropOnTier(tier.id)}
            >
              {tier.items.map((card) => (
                <div
                    key={card.id}
                    className="flex items-center"
                    onDragOver={(e) => handleDragOverCard(tier.id, card.id, e)}
                    onDrop={(e) => dropOnCard(tier.id, card.id, e)}
                >
                  <img
                    src={card.src}
                    data-card-id={card.id}
                    draggable
                    onDragStart={(e) => beginDrag("tier", tier.id, card, e)}
                    onDragEnd={endDrag}
                    onDragOver={(e) => handleDragOverCard(tier.id, card.id, e)}
                    className="w-20 h-20 object-cover rounded border border-zinc-700 cursor-grab"
                  />
                </div>
              ))}
            </div>

            <div className="w-14 bg-zinc-900 flex flex-col items-center justify-center gap-1 py-2">
              <button onClick={() => openSettings(tier)}>⚙</button>
              <button onClick={() => moveTier(tier.id, "up")}>▲</button>
              <button onClick={() => moveTier(tier.id, "down")}>▼</button>
            </div>
          </div>
        ))}
      </div>

      {/* Unsorted */}
      <div
        className="items mt-2 border border-zinc-800 rounded bg-zinc-800/40 p-3 min-h-[120px]"
        onDragOver={(e) => {
          e.preventDefault();
          if (dragging) positionGhost(e.nativeEvent, dragging.card.id);
        }}
        onDrop={(e) => {
          e.preventDefault();
          dropOnUnsorted();
        }}
      >
        <h2 className="text-sm font-semibold mb-2 text-zinc-200">Unsorted</h2>
        <div className="flex flex-wrap gap-2">
          {cards.map((card, idx) => (
            <div
              key={card.id}
              className="flex items-center"
              onDragOver={(e) => {
                e.preventDefault();
                if (dragging) positionGhost(e.nativeEvent, dragging.card.id);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!dragging) return;

                // if dropping on ourselves in unsorted and position wouldn't change -> no-op
                if (dragging.from === "cards" && dragging.card.id === card.id) {
                  endDrag();
                  return;
                }

                const rect = (e.target as HTMLElement).getBoundingClientRect();
                const mid = rect.left + rect.width / 2;
                const before = e.clientX < mid;

                // remove dragged from tiers / cards
                const newTiers = removeCardFromTiers(tiers, dragging.card.id);
                let newCards = cards.filter((c) => c.id !== dragging.card.id);

                // figure out target index in current cards
                const targetIdx = cards.findIndex((c) => c.id === card.id);
                if (targetIdx === -1) {
                  newCards.push(dragging.card);
                } else {
                  const insertAt = before ? targetIdx : targetIdx + 1;
                  newCards.splice(insertAt, 0, dragging.card);
                }

                setTiers(newTiers);
                setCards(newCards);
                endDrag();
              }}
            >
              <img
                src={card.src}
                data-card-id={card.id}
                draggable
                onDragStart={(e) => beginDrag("cards", undefined, card, e)}
                onDragEnd={endDrag}
                className="w-20 h-20 object-cover rounded border border-zinc-700 cursor-grab"
              />
            </div>
          ))}
          {cards.length === 0 && (
            <p className="text-xs text-zinc-500 italic">Drop cards here</p>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && activeTier && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center"
          onClick={(e) => e.target === e.currentTarget && closeSettings()}
        >
          <div className="bg-zinc-900 rounded p-5 border border-zinc-700 max-w-md w-full space-y-4">
            <div>
              <label className="block text-sm text-zinc-300 mb-1">Tier Label</label>
              <textarea
                value={editingLabel}
                onChange={(e) => setEditingLabel(e.target.value)}
                onBlur={() =>
                  setTiers((p) =>
                    p.map((t) =>
                      t.id === activeTierId ? { ...t, label: editingLabel } : t
                    )
                  )
                }
                className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full text-sm"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-300 mb-1">Color</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() =>
                      setTiers((p) =>
                        p.map((t) =>
                          t.id === activeTierId ? { ...t, color: c } : t
                        )
                      )
                    }
                    style={{ backgroundColor: c }}
                    className={`w-7 h-7 rounded-full border-2 ${
                      activeTier.color === c
                        ? "border-white shadow"
                        : "border-transparent"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button onClick={deleteTier} className="bg-red-500 px-3 py-1 rounded text-sm">
                Delete
              </button>
              <button
                onClick={clearTier}
                className="bg-zinc-300 text-black px-3 py-1 rounded text-sm"
              >
                Clear
              </button>
              <button
                onClick={() =>
                  addTier("Change me", tiers.findIndex((t) => t.id === activeTier.id))
                }
                className="bg-zinc-300 text-black px-3 py-1 rounded text-sm"
              >
                Add Above
              </button>
              <button
                onClick={() =>
                  addTier(
                    "Change me",
                    tiers.findIndex((t) => t.id === activeTier.id) + 1
                  )
                }
                className="bg-zinc-300 text-black px-3 py-1 rounded text-sm"
              >
                Add Below
              </button>
              <button
                onClick={closeSettings}
                className="ml-auto border border-zinc-600 px-3 py-1 rounded text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
