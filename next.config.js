/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5001/api/:path*',
      },
      {
        source: '/submit',
        destination: 'http://localhost:5001/submit',
      },
      {
        source: '/health',
        destination: 'http://localhost:5001/health',
      },
      {
        source: '/debug',
        destination: 'http://localhost:5001/debug',
      }
    ];
  }
}

module.exports = nextConfig
