import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { nodePolyfills } from "vite-plugin-node-polyfills"
import { visualizer } from "rollup-plugin-visualizer"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), nodePolyfills(), visualizer({ open: true })],
  server: {
    historyApiFallback: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@solana/web3.js') || id.includes('@solana/pay')) {
            return 'solana-core';
          }
          if (id.includes('@solana/wallet-adapter') || id.includes('@coral-xyz/anchor')) {
            return 'solana-wallets';
          }
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
});
