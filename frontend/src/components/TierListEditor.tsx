import { useState } from "react";
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
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
    {
      id: "s",
      name: "S",
      items: [
        { id: "1", imageUrl: "https://picsum.photos/200/200?random=1", name: "Item A" },
        { id: "2", imageUrl: "https://picsum.photos/200/200?random=2", name: "Item B" },
      ],
    },
    {
      id: "a",
      name: "A",
      items: [{ id: "3", imageUrl: "https://picsum.photos/200/200?random=3", name: "Item C" }],
    },
    { id: "b", name: "B", items: [] },
  ]);

  const [undecided, setUndecided] = useState<TierItemType[]>([
    { id: "x1", imageUrl: "https://picsum.photos/200/200?random=4", name: "Unsorted 1" },
    { id: "x2", imageUrl: "https://picsum.photos/200/200?random=5", name: "Unsorted 2" },
  ]);

  // helper: which container is this item currently in?
  function findContainerByItemId(itemId: string): string | null {
    // tiers
    for (const tier of tiers) {
      if (tier.items.some((i) => i.id === itemId)) return tier.id;
    }
    // undecided
    if (undecided.some((i) => i.id === itemId)) return "undecided";
    return null;
  }

  // helper: get items in a container
  function getItems(containerId: string): TierItemType[] {
    if (containerId === "undecided") return undecided;
    const tier = tiers.find((t) => t.id === containerId);
    return tier ? tier.items : [];
  }

  // main drag-end handler
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const fromContainer = findContainerByItemId(activeId);
    // over could be a container (tier) OR another item
    const toContainer =
      over.data?.current?.tierId ??
      findContainerByItemId(overId);

    if (!fromContainer || !toContainer) return;

    // if dropping in the same container, just reorder
    if (fromContainer === toContainer) {
      const items = getItems(fromContainer);
      const oldIndex = items.findIndex((i) => i.id === activeId);
      const newIndex = items.findIndex((i) => i.id === overId);
      if (oldIndex === -1 || newIndex === -1) return;

      const newItems = arrayMove(items, oldIndex, newIndex);

      if (fromContainer === "undecided") {
        setUndecided(newItems);
      } else {
        setTiers((prev) =>
          prev.map((t) =>
            t.id === fromContainer ? { ...t, items: newItems } : t
          )
        );
      }
      return;
    }

    // moving between containers
    const fromItems = getItems(fromContainer);
    const itemToMove = fromItems.find((i) => i.id === activeId);
    if (!itemToMove) return;

    // remove from source
    if (fromContainer === "undecided") {
      setUndecided((prev) => prev.filter((i) => i.id !== activeId));
    } else {
      setTiers((prev) =>
        prev.map((t) =>
          t.id === fromContainer
            ? { ...t, items: t.items.filter((i) => i.id !== activeId) }
            : t
        )
      );
    }

    // add to destination (append for now)
    if (toContainer === "undecided") {
      setUndecided((prev) => [...prev, itemToMove]);
    } else {
      setTiers((prev) =>
        prev.map((t) =>
          t.id === toContainer
            ? { ...t, items: [...t.items, itemToMove] }
            : t
        )
      );
    }
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex flex-col gap-4 p-4 min-h-screen bg-gray-950 text-white">
        {tiers.map((tier) => (
          <TierRow key={tier.id} tier={tier} />
        ))}

        <UndecidedZone items={undecided} />
      </div>
    </DndContext>
  );
}
