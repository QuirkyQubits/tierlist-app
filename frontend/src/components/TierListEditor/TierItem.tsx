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
  onRename: (tierId: string | undefined, cardId: string, newName: string) => void;
}

const getImageSrc = (src: string) => {
  if (src.startsWith("/uploads/")) {
    return `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}${src}`;
  }
  return src;
};

export default function TierItem({
  card,
  from,
  tierId,
  beginDrag,
  endDrag,
  handleDragOver,
  handleDrop,
  onDelete,
  onRename
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
        src={getImageSrc(card.src)}
        alt={card.name}
        draggable
        onDragStart={(e) => beginDrag(from, tierId, card, e)}
        onDragEnd={endDrag}
        className="w-20 h-20 object-cover rounded border border-zinc-700 cursor-grab"
      />
      <span
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => {
          const newText = e.currentTarget.textContent?.trim() ?? "";
          onRename(tierId, card.id, newText);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className="mt-1 text-sm text-zinc-300 outline-none cursor-text text-center 
                   block max-w-[80px] wrap-break-word"
      >
        {card.name}
      </span>


    </div>
  );
}
