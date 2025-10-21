import { build, defineConfig } from "vite";

export default defineConfig({
    root: '.',
    server: {
        open: 'index.html',
        port: 5173,
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        assetsDir: 'assets',
        rollupOptions: {
            input: 'index.html,'
        },
    },
});