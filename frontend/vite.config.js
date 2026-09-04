import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": {
        // API_PROXY=http://127.0.0.1:8000 when the backend runs outside docker
        target: process.env.API_PROXY || "http://backend:8000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
