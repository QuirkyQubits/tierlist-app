import { useState, useEffect, useRef } from "react";

interface AddCardFormProps {
  onAdd: (name: string, src: string) => void;
}

export default function AddCardForm({ onAdd }: AddCardFormProps) {
  const [name, setName] = useState("");
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const pasteZoneRef = useRef<HTMLDivElement | null>(null);

  // Handle paste events only when focused inside the paste area
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (!pasteZoneRef.current?.contains(target)) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (!file) continue;
          const url = URL.createObjectURL(file);
          setImageSrc(url);
          break;
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  const handleAdd = () => {
    if (!imageSrc) {
      alert("Please paste an image first!");
      return;
    }
    onAdd(name.trim() || "<name>", imageSrc);
    setName("");
    setImageSrc(null);
  };

  return (
    <div className="bg-zinc-800/60 border border-zinc-700 rounded p-4 mb-6">
      <h2 className="text-lg font-semibold mb-3">Add New Card</h2>

      <div className="space-y-3">
        {/* Name field */}
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter card name"
            className="w-full p-2 rounded bg-zinc-900 border border-zinc-700 text-sm text-white"
          />
        </div>

        {/* Paste zone */}
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Image</label>
          <div
            ref={pasteZoneRef}
            className="border-2 border-dashed border-zinc-600 rounded p-4 h-40 flex items-center justify-center text-zinc-500 text-sm cursor-text"
          >
            {imageSrc ? (
              <img
                src={imageSrc}
                alt="Preview"
                className="max-h-full max-w-full rounded"
              />
            ) : (
              <span>Click here and press Ctrl + V to paste an image</span>
            )}
          </div>
        </div>

        {/* Add button */}
        <button
          onClick={handleAdd}
          className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded text-sm mt-3"
        >
          + Add Card
        </button>
      </div>
    </div>
  );
}
