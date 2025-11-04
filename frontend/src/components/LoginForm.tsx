import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/axios";

export default function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post("/api/login", { email, password });
      const token = res.data?.token;

      if (token) {
        localStorage.setItem("token", token); // store the JWT
        onLogin(); // update app state
        navigate("/my-tierlists");
      } else {
        setError("No token received");
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      setError(err.response?.data?.error || "Login failed");
    }
  }

  return (
    <div className="p-6 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">Login</h1>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 w-full max-w-xs"
      >
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 rounded"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600"
        >
          Log In
        </button>
      </form>

      {error && <p className="text-red-500 mt-2">{error}</p>}

      <p className="mt-4 text-sm text-gray-600">
        Don't have an account?{" "}
        <Link
          to="/register"
          className="text-emerald-600 hover:underline font-medium"
        >
          Register here
        </Link>
      </p>
    </div>
  );
}
