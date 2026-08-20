import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [vue()],
    build: {
        outDir: "dist",
        emptyOutDir: true,
        rollupOptions: {
            input: { popup: "popup.html", options: "options.html", background: "src/background/index.ts" },
            output: { entryFileNames: "assets/[name].js", chunkFileNames: "assets/[name]-[hash].js", assetFileNames: "assets/[name]-[hash][extname]" },
        },
    },
});
