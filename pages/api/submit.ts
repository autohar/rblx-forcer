import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { title, directory, webhook } = req.body;

  if (!title || !directory || !webhook) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    // Insert into Supabase
    const { data, error } = await supabase
      .from("sites")
      .insert([{ title, directory, webhook }]);

    if (error) throw error;

    // (Optional) Could auto-generate a folder in /public/[directory]
    // or trigger a webhook here if desired

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
