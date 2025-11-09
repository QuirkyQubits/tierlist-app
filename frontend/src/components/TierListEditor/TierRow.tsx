import React from "react";
import TierItem from "./TierItem";
import type { Tier } from "./types";

interface Props {
  tier: Tier;
  onOpenSettings: (tier: Tier) => void;
  onMoveTier: (id: string, dir: "up" | "down") => void;
  beginDrag: any;
  endDrag: any;
  handleDragOverTier: (e: React.DragEvent) => void;
  handleDragOverCard: (e: React.DragEvent) => void;
  dropOnTier: (tierId: string) => void;
  dropOnCard: (tierId: string, targetId: string, e: React.DragEvent) => void;
  onDelete: (tierId: string | undefined, cardId: string) => void;
}

export default function TierRow({
  tier,
  onOpenSettings,
  onMoveTier,
  beginDrag,
  endDrag,
  handleDragOverTier,
  handleDragOverCard,
  dropOnTier,
  dropOnCard,
  onDelete
}: Props) {
  return (
    <div className="flex border-b border-zinc-900 last:border-none">
      <div
        className="w-28 flex items-center justify-center font-semibold text-sm"
        style={{ backgroundColor: tier.color }}
      >
        {tier.label}
      </div>

      <div
        className="items flex flex-wrap gap-2 flex-1 min-h-[90px] p-2"
        onDragOver={(e) => handleDragOverTier(e)}
        onDrop={(e) => {
          if (e.target === e.currentTarget) {
            e.preventDefault();
            dropOnTier(tier.id);
          }
        }}
      >
        {tier.items.map((card) => (
          <TierItem
            key={card.id}
            card={card}
            from="tier"
            tierId={tier.id}
            beginDrag={beginDrag}
            endDrag={endDrag}
            handleDragOver={(e) => handleDragOverCard(e)}
            handleDrop={(e) => dropOnCard(tier.id, card.id, e)}
            onDelete={onDelete}
          />
        ))}
      </div>

      <div className="w-14 bg-zinc-900 flex flex-col items-center justify-center gap-1 py-2">
        <button onClick={() => onOpenSettings(tier)}>⚙</button>
        <button onClick={() => onMoveTier(tier.id, "up")}>▲</button>
        <button onClick={() => onMoveTier(tier.id, "down")}>▼</button>
      </div>
    </div>
  );
}
