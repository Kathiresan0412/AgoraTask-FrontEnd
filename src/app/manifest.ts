import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AgoraTask",
    short_name: "AgoraTask",
    id: "/",
    description:
      "Discover trusted specialists for home, learning, wellness, and business support.",
    start_url: "/lk",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0067E8",
    orientation: "portrait-primary",
    categories: ["business", "productivity", "shopping"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/maskable-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
