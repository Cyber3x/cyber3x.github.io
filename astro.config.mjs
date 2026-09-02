// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { SITE_URL } from "./src/consts";

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  integrations: [mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
  fonts: [
    {
      name: "Atkinson Hyperlegible Next",
      cssVariable: "--font-atkinson",
      provider: fontProviders.fontsource(),
      weights: ["200 800"],
      styles: ["normal", "italic"],
      subsets: ["latin", "latin-ext"],
      fallbacks: ["sans-serif"],
    },
  ],
  markdown: {
    shikiConfig: {
      themes: {
        light: "catppuccin-latte",
        dark: "catppuccin-mocha",
      },
    },
  },
});
