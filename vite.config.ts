import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => {
  // Support multiple deployment targets:
  // - VITE_BASE_PATH=/ for custom domains or Lovable
  // - VITE_BASE_PATH=/Family-Tree-Memory-Maker/ for GitHub Pages (default in production)
  const base = process.env.VITE_BASE_PATH ?? 
    (mode === 'production' ? '/Family-Tree-Memory-Maker/' : '/');
  
  return {
    base,
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
