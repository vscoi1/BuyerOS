import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
    test: {
        environment: "node",
        // Mock Prisma-related modules so tests always use the in-memory path.
        // getPrismaClient returns null → data-access falls back to in-memory store.
        server: {
            deps: {
                inline: ["@prisma/client"],
            },
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});
