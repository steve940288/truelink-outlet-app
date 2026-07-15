/** @type {import('next').NextConfig} */
const BASE_PATH = "/registeroutlets";

const nextConfig = {
  reactStrictMode: true,
  basePath: BASE_PATH,
  env: {
    NEXT_PUBLIC_BASE_PATH: BASE_PATH,
  },
  // Shared/CloudLinux cPanel hosting often caps processes per account.
  // Next's build spawns parallel worker processes by default, which can
  // exceed that cap (spawn EAGAIN). Force a single-process build instead.
  experimental: {
    cpus: 1,
    workerThreads: false,
  },
};

module.exports = nextConfig;
