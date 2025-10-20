import { GetServerSideProps } from "next";
import { supabase } from "../supabaseClient";

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const directory = params?.directory;

  const { data, error } = await supabase
    .from("websites")
    .select("*")
    .eq("directory", directory)
    .single();

  if (!data || error) return { notFound: true };

  return { props: { site: data } };
};

export default function GeneratedSite({ site }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-10">
      <div className="bg-white shadow-xl rounded-2xl p-10 max-w-xl text-center">
        <h1 className="text-5xl font-bold mb-4">{site.title}</h1>
        <p className="text-gray-600 text-lg">
          Welcome to <strong>{site.directory}</strong>!
        </p>
        <p className="mt-6 text-sm text-gray-400">
          (Generated using rblx-forcer)
        </p>
      </div>
    </div>
  );
}
