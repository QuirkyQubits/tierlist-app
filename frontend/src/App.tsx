import { Routes, Route, Link } from "react-router-dom";
import HomePage from "./components/HomePage";
import AboutPage from "./components/AboutPage";
import { useQuery } from "@tanstack/react-query";

export default function App() {
  const { data, isLoading } = useQuery({
    queryKey: ["hello"],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 500));
      return "React Query works! ✅";
    },
  });

  return (
    <div className="p-10 text-center">
      {isLoading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <h1 className="text-2xl text-emerald-400">{data}</h1>
      )}
    </div>
  );
}
