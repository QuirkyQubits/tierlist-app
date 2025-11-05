import { Link } from "react-router-dom";

export default function MyTierListsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Tier Lists</h1>
      <p>This is a placeholder for your personal tier lists.</p>

      <div className="mt-4">
        <Link
          to="/tierlist/temp/edit"
          className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600"
        >
          + Create New Tier List
        </Link>
      </div>
    </div>
  );
}
