import { Link } from "react-router-dom";

export default function NavBar() {
  return (
    <nav className="flex gap-4 p-4 bg-background-light border-b">
      <Link to="/my-tierlists" className="text-emerald-500 hover:underline">My Tier Lists</Link>
      <Link to="/tierlist/1" className="text-emerald-500 hover:underline">Example Tier List</Link>
      <Link to="/login" className="ml-auto text-red-400 hover:underline">Logout</Link>
    </nav>
  );
}
