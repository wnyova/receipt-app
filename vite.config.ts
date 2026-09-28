import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
const proxy = {
  target: "http://127.0.0.1:3001",
  changeOrigin: true,
  configure(proxy: any) {
    proxy.on("proxyReq", (outgoing: any, incoming: any) => {
      if (incoming.headers.origin === "http://terminal.local:4173")
        outgoing.setHeader("origin", "http://127.0.0.1:5173");
    });
  },
};
export default defineConfig({
  plugins: [react(), tailwind()],
  server: {
    host: "127.0.0.1",
    allowedHosts: ["terminal.local"],
    port: 5173,
    strictPort: true,
    proxy: { "/api": proxy, "/uploads": proxy },
  },
});
