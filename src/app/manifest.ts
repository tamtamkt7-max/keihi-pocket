import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "経費ポケット",
    short_name: "経費ポケット",
    description: "レシートを撮って、経費と売上をまとめて管理。",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f6f7f4",
    theme_color: "#117865",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
