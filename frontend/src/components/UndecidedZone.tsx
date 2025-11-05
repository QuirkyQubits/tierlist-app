import TierItem from "./TierItem";
import type { TierItemType } from "./TierListEditor";

interface UndecidedZoneProps {
  items: TierItemType[];
  onDropItem: (targetTierId: string, itemId: string) => void;
  draggingItemId: string | null;
  setDraggingItemId: (id: string | null) => void;
  setDraggingItem?: (item: TierItemType | null) => void;
  setDragPosition?: (pos: { x: number; y: number } | null) => void;
}

export default function UndecidedZone({
  items,
  onDropItem,
  draggingItemId,
  setDraggingItemId,
  setDraggingItem,
  setDragPosition,
}: UndecidedZoneProps) {
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData("text/plain");
    onDropItem("undecided", itemId);
  };

  return (
    <div
      className="mt-6 p-4 bg-gray-900 rounded-md min-h-[100px]"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <h2 className="text-lg font-semibold mb-2 text-gray-200">Unsorted</h2>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <TierItem
            key={item.id}
            item={item}
            tierId="undecided"
            onReorderItem={() => {}}
            setDraggingItemId={setDraggingItemId}
            // ✅ Defensive defaults — prevents “is not a function”
            setDraggingItem={setDraggingItem ?? (() => {})}
            setDragPosition={setDragPosition ?? (() => {})}
          />
        ))}
        {items.length === 0 && (
          <p className="text-gray-500 text-sm italic">Drop items here</p>
        )}
      </div>
    </div>
  );
}
