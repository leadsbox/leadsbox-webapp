import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const optimizeLandingHtml = () => ({
  name: "optimize-landing-html",
  transformIndexHtml(html: string) {
    const withoutModulePreload = html.replace(/<link rel="modulepreload"[^>]*>/g, "");
    return withoutModulePreload.replace(
      /<link rel="stylesheet"([^>]*href="[^"]+"[^>]*)>/g,
      (match, attrs) => {
        const hrefMatch = attrs.match(/href="([^"]+)"/);
        if (!hrefMatch) return match;
        const href = hrefMatch[1];
        const crossorigin = /crossorigin/.test(attrs) ? ' crossorigin' : '';
        return `<link rel="preload"${crossorigin} as="style" href="${href}" onload="this.rel='stylesheet'"><noscript>${match}</noscript>`;
      }
    );
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    optimizeLandingHtml(),
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
