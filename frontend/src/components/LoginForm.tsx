export default function LoginForm({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="p-6 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <button
        className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600"
        onClick={onLogin}
      >
        Simulate Login
      </button>
    </div>
  );
}
