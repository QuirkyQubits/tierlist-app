import { useState } from "react";
import TierRow from "./TierRow";
import UndecidedZone from "./UndecidedZone";

export interface TierItemType {
  id: string;
  imageUrl?: string;
  name?: string;
  description?: string;
}

export interface TierType {
  id: string;
  name: string;
  items: TierItemType[];
}

export default function TierListEditor() {
  const [tiers, setTiers] = useState<TierType[]>([
    { id: "s", name: "S", items: [{ id: "1", imageUrl: "https://picsum.photos/200?1", name: "Item A" }] },
    { id: "a", name: "A", items: [{ id: "2", imageUrl: "https://picsum.photos/200?2", name: "Item B" }] },
    { id: "b", name: "B", items: [] },
  ]);

  const [undecided, setUndecided] = useState<TierItemType[]>([
    { id: "x1", imageUrl: "https://picsum.photos/200?3", name: "Unsorted 1" },
    { id: "x2", imageUrl: "https://picsum.photos/200?4", name: "Unsorted 2" },
  ]);

  // drag-related states
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [hoverTarget, setHoverTarget] = useState<{
    tierId: string;
    targetId: string;
    before: boolean;
  } | null>(null);
  const [draggingItem, setDraggingItem] = useState<TierItemType | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);

  const handleDropItem = (targetTierId: string, itemId: string) => {
    moveItem(itemId, targetTierId);
    setHoverTarget(null);
  };

  const handleReorderItem = (
    targetTierId: string,
    targetItemId: string,
    itemId: string,
    before: boolean
  ) => {
    moveItem(itemId, targetTierId, targetItemId, before);
    setHoverTarget(null);
  };

  const moveItem = (
    itemId: string,
    targetTierId: string,
    targetItemId?: string,
    before = false
  ) => {
    let item: TierItemType | undefined;

    let newTiers = tiers.map((t) => {
      const exists = t.items.find((i) => i.id === itemId);
      if (exists) item = exists;
      return { ...t, items: t.items.filter((i) => i.id !== itemId) };
    });

    let newUndecided = undecided.filter((i) => i.id !== itemId);
    if (!item) item = undecided.find((i) => i.id === itemId);
    if (!item) return;

    if (targetTierId === "undecided") {
      newUndecided = [...newUndecided, item];
    } else {
      newTiers = newTiers.map((t) => {
        if (t.id !== targetTierId) return t;
        const items = [...t.items];
        if (targetItemId) {
          const index = items.findIndex((i) => i.id === targetItemId);
          const insertAt = before ? index : index + 1;
          items.splice(insertAt, 0, item!);
        } else {
          items.push(item!);
        }
        return { ...t, items };
      });
    }

    setTiers(newTiers);
    setUndecided(newUndecided);
  };

  return (
    <div className="flex flex-col gap-4 p-4 min-h-screen bg-gray-950 text-white">
      {tiers.map((tier) => (
        <TierRow
          key={tier.id}
          tier={tier}
          onDropItem={handleDropItem}
          onReorderItem={handleReorderItem}
          draggingItemId={draggingItemId}
          setDraggingItemId={setDraggingItemId}
          hoverTarget={hoverTarget}
          setHoverTarget={setHoverTarget}
          setDraggingItem={setDraggingItem}
          setDragPosition={setDragPosition}
        />
      ))}

      <UndecidedZone
        items={undecided}
        onDropItem={handleDropItem}
        draggingItemId={draggingItemId}
        setDraggingItemId={setDraggingItemId}
        setDraggingItem={setDraggingItem}
        setDragPosition={setDragPosition}
      />

      {draggingItem && dragPosition && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            top: dragPosition.y - 40,
            left: dragPosition.x - 40,
            width: "80px",
            height: "80px",
            transform: "translate(-50%, -50%)",
          }}
        >
          <img
            src={draggingItem.imageUrl}
            alt={draggingItem.name}
            className="rounded-md border border-gray-500 shadow-lg opacity-90 scale-105"
          />
        </div>
      )}
    </div>
  );
}
