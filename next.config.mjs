import { readFileSync } from "node:fs";

// Product addresses from the old shop, so links and search results keep working
const legacy = JSON.parse(readFileSync(new URL("./src/data/legacyRedirects.json", import.meta.url), "utf8"));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return legacy.map(({ source, id }) => ({ source, destination: `/product/${id}`, permanent: true }));
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.myikas.com',
      },
      {
        protocol: 'https',
        hostname: 'i.etsystatic.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
