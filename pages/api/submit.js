import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed." });
  }

  const { title, directory, webhookUrl } = req.body;

  if (!title || !directory || !webhookUrl) {
    return res.status(400).json({ success: false, message: "Missing fields." });
  }

  const { error } = await supabase.from("websites").insert([
    { title, directory, webhook_url: webhookUrl },
  ]);

  if (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to save to Supabase." });
  }

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `✅ Your new site is ready: https://rblx-forcer.vercel.app/${directory}`,
      }),
    });
  } catch (e) {
    console.warn("Webhook failed, continuing...");
  }

  return res.status(200).json({
    success: true,
    message: "Website generated successfully!",
    url: `https://rblx-forcer.vercel.app/${directory}`,
  });
}
