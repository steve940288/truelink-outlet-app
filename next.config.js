/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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