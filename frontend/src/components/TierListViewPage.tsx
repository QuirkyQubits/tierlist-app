import { useParams } from "react-router-dom";

export default function TierListViewPage() {
  const { id } = useParams();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Tier List {id}</h1>
      <p>This is where you’ll view or edit a single tier list.</p>
    </div>
  );
}
