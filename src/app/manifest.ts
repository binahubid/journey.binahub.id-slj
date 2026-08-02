import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Spiritual Leadership Journey",
    short_name: "SLJ",
    description: "Platform pendamping transformasi 90 hari BinaJourney.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#FAF8F4",
    theme_color: "#071A33",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icons/journey-icon.webp",
        sizes: "192x192",
        type: "image/webp",
        purpose: "any",
      },
      {
        src: "/icons/journey-icon.webp",
        sizes: "512x512",
        type: "image/webp",
        purpose: "any",
      },
      {
        src: "/icons/journey-icon.webp",
        sizes: "512x512",
        type: "image/webp",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Dashboard SLJ",
        short_name: "Dashboard",
        url: "/dashboard",
        icons: [{ src: "/icons/journey-icon.webp", sizes: "192x192" }],
      },
      {
        name: "Monitoring Journey",
        short_name: "Monitoring",
        url: "/monitoring",
        icons: [{ src: "/icons/journey-icon.webp", sizes: "192x192" }],
      },
    ],
  };
}
