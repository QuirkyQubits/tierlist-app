import React from "react";
import type { Card } from "./types";

interface Props {
  card: Card;
  from: "cards" | "tier";
  tierId?: string;
  beginDrag: (from: "cards" | "tier", tierId: string | undefined, card: Card, e: React.DragEvent) => void;
  endDrag: () => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop?: (e: React.DragEvent) => void;
  onDelete: (tierId: string | undefined, cardId: string) => void;
}

export default function TierItem({
  card,
  from,
  tierId,
  beginDrag,
  endDrag,
  handleDragOver,
  handleDrop,
  onDelete
}: Props) {
  return (
    <div
      className="tier-item flex flex-col items-center"
      data-card-id={card.id}
      onDragOver={handleDragOver}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleDrop?.(e);
      }}
      onContextMenu={(e) => {
        e.preventDefault(); // stop browser menu
        onDelete(tierId, card.id); // trigger delete
      }}
    >
      <img
        src={card.src}
        draggable
        onDragStart={(e) => beginDrag(from, tierId, card, e)}
        onDragEnd={endDrag}
        className="w-20 h-20 object-cover rounded border border-zinc-700 cursor-grab"
      />
      <span>Text</span>
    </div>
  );
}
