import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
export default defineConfig(({ command, isPreview }) => ({
  plugins: [react()],
  // Keep local dev at /; Pages publishes this app beside the existing website.
  base:
    process.env.VITE_BASE_PATH ??
    (command === "build" || isPreview ? "/WEB_GEMM_ASIC_SKY130/gemm32/" : "/"),
  server: {
    watch: { ignored: ["**/test-results/**", "**/playwright-report/**"] },
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three", "@react-three/fiber", "@react-three/drei"],
        },
      },
    },
  },
  test: { include: ["tests/**/*.test.ts"] },
}));
