import TierItem from "./TierItem";
import type { TierItemType } from "./TierListEditor";

interface TierRowProps {
  tier: {
    id: string;
    name: string;
    items: TierItemType[];
  };
  onDropItem: (targetTierId: string, itemId: string) => void;
  onReorderItem: (
    targetTierId: string,
    targetItemId: string,
    itemId: string,
    before: boolean
  ) => void;
  draggingItemId: string | null;
  setDraggingItemId: (id: string | null) => void;
  hoverTarget: { tierId: string; targetId: string; before: boolean } | null;
  setHoverTarget: (hover: { tierId: string; targetId: string; before: boolean } | null) => void;
  setDraggingItem: (item: TierItemType | null) => void;       // ✅ added
  setDragPosition: (pos: { x: number; y: number } | null) => void; // ✅ added
}

export default function TierRow({
  tier,
  onDropItem,
  onReorderItem,
  draggingItemId,
  setDraggingItemId,
  hoverTarget,
  setHoverTarget,
  setDraggingItem,
  setDragPosition,
}: TierRowProps) {
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  const handleDropEmpty = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData("text/plain");
    onDropItem(tier.id, itemId);
  };

  return (
    <div
      className="flex flex-row bg-gray-800 rounded-md overflow-x-auto p-2 items-start min-h-[150px]"
      onDragOver={handleDragOver}
      onDrop={handleDropEmpty}
    >
      <div className="flex flex-col items-center justify-start w-14 mr-2">
        <span className="text-xl font-bold mb-1">{tier.name}</span>
      </div>

      <div className="flex flex-wrap gap-2 flex-1">
        {tier.items.map((item) => {
          const isHoverBefore =
            hoverTarget?.tierId === tier.id &&
            hoverTarget?.targetId === item.id &&
            hoverTarget?.before;
          const isHoverAfter =
            hoverTarget?.tierId === tier.id &&
            hoverTarget?.targetId === item.id &&
            !hoverTarget?.before;

          return (
            <TierItem
              key={item.id}
              item={item}
              tierId={tier.id}
              onReorderItem={onReorderItem}
              setDraggingItemId={setDraggingItemId}
              setDraggingItem={setDraggingItem}
              setDragPosition={setDragPosition}
              setHoverTarget={setHoverTarget}
              isHoverBefore={isHoverBefore}
              isHoverAfter={isHoverAfter}
            />
          );
        })}
      </div>
    </div>
  );
}
