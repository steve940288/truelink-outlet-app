/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure these read-only data files get bundled into the serverless
  // functions that need them (Vercel traces file usage automatically in most
  // cases, but this makes it explicit and reliable).
  experimental: {
    outputFileTracingIncludes: {
      "/api/login/route": ["./data/users.json"],
      "/api/me/route": ["./data/users.json"],
      "/api/outlets/route": ["./data/id_token_mapping.csv"],
      "/api/outlets/[code]/route": ["./data/id_token_mapping.csv"],
    },
  },
};

module.exports = nextConfig;
