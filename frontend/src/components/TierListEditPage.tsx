import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import TierListEditor from "./TierListEditor/TierListEditor";
import { api } from "../lib/axios";

export default function TierListEditPage() {
  const { id } = useParams();
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || id === "new") {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await api.get(`/api/tierlists/${id}`);
        setInitialData(res.data);
      } catch (err) {
        console.error("Failed to load tierlist", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="p-6">Loading tier list...</div>;

  return (
    <div className="flex flex-col">
      <h1 className="text-2xl font-bold p-4">
        {id === "new" ? "Creating New Tier List" : `Editing Tier List #${id}`}
      </h1>
      <TierListEditor initialData={initialData} />
    </div>
  );
}
