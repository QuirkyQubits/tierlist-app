import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TierItem from "./TierItem";
import type { TierItemType } from "./TierListEditor";

interface TierRowProps {
  tier: {
    id: string;
    name: string;
    items: TierItemType[];
  };
}

export default function TierRow({ tier }: TierRowProps) {
  const { setNodeRef } = useDroppable({
    id: tier.id,
    data: { tierId: tier.id },
  });

  return (
    <div
      ref={setNodeRef}
      className="flex flex-row bg-gray-800 rounded-md overflow-x-auto p-2 items-start min-h-[150px]"
    >
      {/* label */}
      <div className="flex flex-col items-center justify-start w-14 mr-2">
        <span className="text-xl font-bold mb-1">{tier.name}</span>
      </div>

      {/* items */}
      <SortableContext
        items={tier.items.map((i) => i.id)}
        strategy={rectSortingStrategy}
      >
        <div className="flex flex-wrap gap-2 flex-1">
          {tier.items.map((item) => (
            <SortableItem key={item.id} item={item} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

function SortableItem({ item }: { item: TierItemType }) {
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
