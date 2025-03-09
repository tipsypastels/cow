import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

// @ts-expect-error we don't have @types/node.
const repo: string | undefined = process.env.GITHUB_REPO;

export default defineConfig({
  base: repo ? `/${repo}/` : undefined,
  plugins: [
    tailwindcss(),
  ],
});
