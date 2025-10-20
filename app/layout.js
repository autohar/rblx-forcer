export const metadata = {
  title: "RBLX Forcer Generator",
  description: "Generate custom websites with webhook integration using RBLX Forcer",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
