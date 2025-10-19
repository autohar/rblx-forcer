import { supabase } from "../../supabaseClient";

export default async function DirectoryPage({ params }) {
  const { directory } = params;

  // Fetch the site info from Supabase
  const { data, error } = await supabase
    .from("websites")
    .select("*")
    .eq("directory", directory)
    .single();

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <h1 className="text-3xl font-bold mb-4">❌ Site Not Found</h1>
        <p className="text-gray-400">No record found for "{directory}".</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-700 to-blue-600 text-white">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-8 text-center w-[90%] md:w-[450px]">
        <h1 className="text-3xl font-bold mb-4">
          🎉 Welcome to {data.directory}!
        </h1>
        <p className="mb-6 text-gray-200">
          This page was automatically created via the RBLX Generator.
        </p>

        <div className="bg-white/20 p-4 rounded-lg mb-4 text-left text-sm">
          <p>
            <strong>🔗 Directory:</strong> {data.directory}
          </p>
          <p>
            <strong>📡 Webhook:</strong>{" "}
            <a
              href={data.webhook_url}
              className="underline text-blue-200 break-all"
              target="_blank"
              rel="noopener noreferrer"
            >
              {data.webhook_url}
            </a>
          </p>
        </div>

        <a
          href="/"
          className="mt-4 inline-block bg-white text-blue-700 font-semibold px-4 py-2 rounded-lg hover:bg-blue-200 transition"
        >
          ← Back to Home
        </a>
      </div>
    </div>
  );
      }
