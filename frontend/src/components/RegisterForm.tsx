import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../lib/axios";

export default function RegisterForm() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const res = await api.post("/api/register", {
        email,
        username,
        password,
      });

      if (res.data?.token) {
        setSuccess("Account created successfully! Please log in.");
        setTimeout(() => navigate("/login"), 1200);
      } else {
        setError("No token received");
      }
    } catch (err: any) {
      console.error("Registration failed:", err);
      setError(err.response?.data?.error || "Registration failed");
    }
  }

  return (
    <div className="p-6 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">Register</h1>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 w-full max-w-xs"
      >
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border p-2 rounded"
        />
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
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Create Account
        </button>
      </form>
      {success && <p className="text-green-500 mt-2">{success}</p>}
      {error && <p className="text-red-500 mt-2">{error}</p>}

      <p className="mt-4 text-sm text-gray-600">
        Already have an account?{" "}
        <Link
          to="/login"
          className="text-emerald-600 hover:underline font-medium"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
