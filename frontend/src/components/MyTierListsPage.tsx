import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/axios";
import { Trash2 } from "lucide-react";

interface TierListSummary {
  id: number;
  title: string;
}

export default function MyTierListsPage() {
  const [tierlists, setTierlists] = useState<TierListSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/api/tierlists/my-tierlists");
        setTierlists(res.data);
      } catch (err) {
        console.error("Failed to fetch tierlists", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleDeleteTierList(id: number, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;

    try {
      await api.delete(`/api/tierlists/${id}`);
      setTierlists((prev) => prev.filter((x) => x.id !== id));
    } catch (err) {
      console.error("Failed to delete tierlist", err);
      alert("Failed to delete tier list");
    }
  }

  if (loading) return <div className="p-6">Loading your tier lists...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Tier Lists</h1>

      <Link
        to="/tierlist/new/edit"
        className="inline-block mb-4 px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600"
      >
        + Create New Tier List
      </Link>

      {tierlists.length === 0 ? (
        <p>You don’t have any tier lists yet.</p>
      ) : (
        <ul className="space-y-2">
          {tierlists.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between w-[20%] min-w-[250px] 
                        bg-zinc-800/40 border border-zinc-700 rounded px-3 py-2"
            >
              <Link
                to={`/tierlist/${t.id}/edit`}
                className="text-emerald-400 hover:underline truncate"
              >
                {t.title || "(Untitled)"}
              </Link>

              <button
                onClick={() => handleDeleteTierList(t.id, t.title)}
                className="text-zinc-400 hover:text-red-500 ml-3 transition"
                title="Delete this tier list"
              >
                <Trash2 size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
