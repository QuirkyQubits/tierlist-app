import React from "react";
import TierItem from "./TierItem";
import type { Card } from "./types";

interface Props {
  cards: Card[];
  beginDrag: any;
  endDrag: any;
  handleDragOver: (e: React.DragEvent) => void;
  dropOnUnsorted: (e: React.DragEvent) => void;
  handleDropOnCard: (e: React.DragEvent, targetCardId: string) => void;
}

export default function UnsortedZone({
  cards,
  beginDrag,
  endDrag,
  handleDragOver,
  dropOnUnsorted,
  handleDropOnCard,
}: Props) {
  return (
    <div
      className="items mt-2 border border-zinc-800 rounded bg-zinc-800/40 p-3 min-h-[120px]"
      onDragOver={handleDragOver}
      onDrop={dropOnUnsorted}
    >
      <h2 className="text-sm font-semibold mb-2 text-zinc-200">Unsorted</h2>
      <div className="flex flex-wrap gap-2">
        {cards.map((card) => (
          <TierItem
            key={card.id}
            card={card}
            from="cards"
            beginDrag={beginDrag}
            endDrag={endDrag}
            handleDragOver={handleDragOver}
            handleDrop={(e) => handleDropOnCard(e, card.id)}
          />
        ))}
        {cards.length === 0 && <p className="text-xs text-zinc-500 italic">Drop cards here</p>}
      </div>
    </div>
  );
}
