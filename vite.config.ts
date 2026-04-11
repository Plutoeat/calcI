import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const repoName = "calcI";

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === "build" ? `/${repoName}/` : "/",
}));
