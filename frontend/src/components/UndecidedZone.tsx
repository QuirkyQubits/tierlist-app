import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TierItem from "./TierItem";
import type { TierItemType } from "./TierListEditor";

interface UndecidedZoneProps {
  items: TierItemType[];
}

export default function UndecidedZone({ items }: UndecidedZoneProps) {
  const { setNodeRef } = useDroppable({
    id: "undecided",
    data: { tierId: "undecided" },
  });

  return (
    <div
      ref={setNodeRef}
      className="mt-6 p-4 bg-gray-900 rounded-md min-h-[100px]"
    >
      <h2 className="text-lg font-semibold mb-2 text-gray-200">
        Undecided Zone
      </h2>
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={rectSortingStrategy}
      >
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <UndecidedSortableItem key={item.id} item={item} />
          ))}
          {items.length === 0 && (
            <p className="text-gray-500 text-sm italic">
              Drop items here to unassign them
            </p>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

function UndecidedSortableItem({ item }: { item: TierItemType }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: item.id,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TierItem item={item} />
    </div>
  );
}
