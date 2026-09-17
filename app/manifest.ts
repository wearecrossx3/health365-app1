import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Health365",
    short_name: "Health365",
    description: "Nutrition guidance built around your routine, your kitchen, and your goals.",
    start_url: "/",
    display: "standalone",
    background_color: "#FBF7EE",
    theme_color: "#C96A3C",
    icons: [
      {
        src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%8C%BF%3C/text%3E%3C/svg%3E",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
