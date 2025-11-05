import React from "react";
import type { TierItemType } from "./TierListEditor";

interface TierItemProps {
  item: TierItemType;
  tierId: string;
  onReorderItem: (targetTierId: string, targetItemId: string, itemId: string, before: boolean) => void;
  setDraggingItemId: (id: string | null) => void;
  setDraggingItem: (item: TierItemType | null) => void;
  setDragPosition: (pos: { x: number; y: number } | null) => void;
  setHoverTarget?: (hover: { tierId: string; targetId: string; before: boolean } | null) => void;
  isHoverBefore?: boolean;
  isHoverAfter?: boolean;
}

export default function TierItem({
  item,
  tierId,
  onReorderItem,
  setDraggingItemId,
  setDraggingItem,
  setDragPosition,
  setHoverTarget,
  isHoverBefore,
  isHoverAfter,
}: TierItemProps) {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("text/plain", item.id);
    setDraggingItemId(item.id);
    setDraggingItem(item);

    // disable default ghost image
    const empty = document.createElement("div");
    e.dataTransfer.setDragImage(empty, 0, 0);
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.clientX && e.clientY) setDragPosition({ x: e.clientX, y: e.clientY });
  };

  const handleDragEnd = () => {
    setDraggingItemId(null);
    setDraggingItem(null);
    setDragPosition(null);
    setHoverTarget?.(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const before = e.clientX < left + width / 2;
    setHoverTarget?.({ tierId, targetId: item.id, before });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData("text/plain");
    if (!draggedId || draggedId === item.id) return;

    const { left, width } = e.currentTarget.getBoundingClientRect();
    const before = e.clientX < left + width / 2;
    onReorderItem(tierId, item.id, draggedId, before);
    setHoverTarget?.(null);
  };

  return (
    <div className="relative">
      {isHoverBefore && (
        <div className="absolute -left-1 top-0 bottom-0 w-1 bg-blue-400 rounded-full animate-pulse z-10"></div>
      )}
      <div
        draggable
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="relative w-24 h-24 bg-gray-700 rounded overflow-hidden border border-gray-500 hover:shadow-lg transition-shadow"
      >
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name || "tier item"}
            className="object-cover w-full h-full opacity-90"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-gray-300 text-xs">
            No image
          </div>
        )}
        {item.name && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate">
            {item.name}
          </div>
        )}
      </div>
      {isHoverAfter && (
        <div className="absolute -right-1 top-0 bottom-0 w-1 bg-blue-400 rounded-full animate-pulse z-10"></div>
      )}
    </div>
  );
}
