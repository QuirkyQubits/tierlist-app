import React from "react";
import type { Tier } from "./types";
import { TIER_COLORS } from "./constants";

interface Props {
  tier: Tier;
  tiers: Tier[];
  editingLabel: string;
  setEditingLabel: (v: string) => void;
  setTiers: any;
  activeTierId: string;
  addTier: (label: string, idx: number) => void;
  deleteTier: () => void;
  clearTier: () => void;
  closeSettings: () => void;
}

export default function TierSettingsModal({
  tier,
  tiers,
  editingLabel,
  setEditingLabel,
  setTiers,
  activeTierId,
  addTier,
  deleteTier,
  clearTier,
  closeSettings,
}: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && closeSettings()}
    >
      <div className="bg-zinc-900 rounded p-5 border border-zinc-700 max-w-md w-full space-y-4">
        <div>
          <label className="block text-sm text-zinc-300 mb-1">Tier Label</label>
          <textarea
            value={editingLabel}
            onChange={(e) => setEditingLabel(e.target.value)}
            onBlur={() =>
              setTiers((p: Tier[]) =>
                p.map((t) => (t.id === activeTierId ? { ...t, label: editingLabel } : t))
              )
            }
            className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-zinc-300 mb-1">Color</label>
          <div className="flex flex-wrap gap-2">
            {TIER_COLORS.map((c) => (
              <button
                key={c}
                onClick={() =>
                  setTiers((p: Tier[]) =>
                    p.map((t) => (t.id === activeTierId ? { ...t, color: c } : t))
                  )
                }
                style={{ backgroundColor: c }}
                className={`w-7 h-7 rounded-full border-2 ${
                  tier.color === c ? "border-white shadow" : "border-transparent"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={deleteTier} className="bg-red-500 px-3 py-1 rounded text-sm">
            Delete
          </button>
          <button onClick={clearTier} className="bg-zinc-300 text-black px-3 py-1 rounded text-sm">
            Clear
          </button>
          <button
            onClick={() =>
              addTier("Change me", tiers.findIndex((t) => t.id === tier.id))
            }
            className="bg-zinc-300 text-black px-3 py-1 rounded text-sm"
          >
            Add Above
          </button>
          <button
            onClick={() =>
              addTier("Change me", tiers.findIndex((t) => t.id === tier.id) + 1)
            }
            className="bg-zinc-300 text-black px-3 py-1 rounded text-sm"
          >
            Add Below
          </button>
          <button
            onClick={closeSettings}
            className="ml-auto border border-zinc-600 px-3 py-1 rounded text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
