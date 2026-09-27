import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Coopérative Plus",
    short_name: "Coop Plus",
    description:
      "Recherchez et réservez vos trajets en taxi-brousse à Madagascar.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#14314C",
    lang: "fr-MG",
    categories: ["travel", "transportation"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
