import { readFileSync } from "node:fs";

// Product addresses from the old shop, so links and search results keep working
const legacy = JSON.parse(readFileSync(new URL("./src/data/legacyRedirects.json", import.meta.url), "utf8"));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    // Old shop's category and info pages have no direct match: send them to the shop
    const oldPages = ["/butun-urunler", "/cok-satanlar", "/nakkas-el-oymasi-tasli", "/erkek-urunlerimiz",
      "/kadin-urunlerimiz", "/iletisim", "/hakkimizda", "/sss"];
    return [
      ...legacy.map(({ source, id }) => ({ source, destination: `/product/${id}`, permanent: true })),
      ...oldPages.map((source) => ({ source, destination: "/", permanent: true })),
    ];
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
