import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/axios";

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
            <li key={t.id}>
              <Link
                to={`/tierlist/${t.id}/edit`}
                className="text-emerald-400 hover:underline"
              >
                {t.title || "(Untitled)"}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
