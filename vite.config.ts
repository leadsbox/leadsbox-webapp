import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "esnext",
    cssCodeSplit: true,
    sourcemap: mode !== "production",
    minify: "esbuild",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("scheduler")) return "vendor-react";
            if (id.includes("react-router")) return "vendor-router";
            if (id.includes("@tanstack")) return "vendor-query";
            if (id.includes("recharts")) return "vendor-charts";
            if (id.includes("framer-motion")) return "vendor-motion";
            if (id.includes("@dnd-kit")) return "vendor-dnd";
            if (id.includes("socket.io-client")) return "vendor-socket";
            return "vendor";
          }
          if (id.includes("src/features/analytics")) return "chunk-analytics";
          if (id.includes("src/features/automations")) return "chunk-automations";
          if (id.includes("src/features/invoices")) return "chunk-invoices";
          return undefined;
        },
      },
    },
  },
}));
