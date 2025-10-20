import { GetServerSideProps } from "next";
import { createClient } from "@supabase/supabase-js";

type Site = {
  id: string;
  title: string;
  directory: string;
  webhook_url?: string;
};

type GeneratedSiteProps = {
  site: Site;
};

export default function GeneratedSite({ site }: GeneratedSiteProps) {
  if (!site) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <h1 className="text-2xl font-bold">404 | Site Not Found</h1>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-10">
      <div className="bg-white shadow-xl rounded-2xl p-10 max-w-xl text-center">
        <h1 className="text-3xl font-bold text-blue-600 mb-4">
          {site.title}
        </h1>
        <p className="text-gray-700">
          This is your generated website at:{" "}
          <span className="text-blue-500 font-semibold">
            /{site.directory}
          </span>
        </p>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { directory } = context.params as { directory: string };
  const { data, error } = await supabase
    .from("websites")
    .select("*")
    .eq("directory", directory)
    .single();

  if (error || !data) {
    return { notFound: true };
  }

  return {
    props: {
      site: data,
    },
  };
};
