import { GetServerSideProps } from "next";
import { createClient } from "@supabase/supabase-js";

type Props = {
  title: string;
  directory: string;
  webhook_url: string;
};

export default function UserSite({ title, directory, webhook_url }: Props) {
  if (!title) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100">
        <h1 className="text-2xl font-bold">404 – Page Not Found</h1>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">{title}</h1>
      <p className="text-gray-600 mb-2">This is your generated page:</p>
      <p className="text-blue-600 mb-6 font-mono">
        https://rblx-forcer.vercel.app/{directory}
      </p>
      <p className="text-gray-800">
        <strong>Webhook URL:</strong> {webhook_url}
      </p>
      <footer className="mt-10 text-gray-400 text-sm">
        Powered by rblx-forcer 💻
      </footer>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const directory = context.params?.directory as string;

  const { data, error } = await supabase
    .from("websites")
    .select("*")
    .eq("directory", directory)
    .single();

  if (error || !data) {
    return { props: { title: "", directory: "", webhook_url: "" } };
  }

  return {
    props: {
      title: data.title,
      directory: data.directory,
      webhook_url: data.webhook_url,
    },
  };
};
