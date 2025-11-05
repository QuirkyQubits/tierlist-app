import React from "react";

interface TierItemProps {
  item: {
    id: string;
    imageUrl?: string;
    name?: string;
    description?: string;
  };
}

export default function TierItem({ item }: TierItemProps) {
  return (
    <div className="relative w-24 h-24 bg-gray-700 rounded overflow-hidden border border-gray-500 hover:shadow-lg transition-shadow">
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
  );
}
