import { reactRouter } from "@react-router/dev/vite";

import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig((config) => ({
    server: {
        port: 8080,
    },
    resolve: {
        ...(config.command === "build" && { alias: { "react-dom/server": "react-dom/server.node" } })
    },
    ssr: {
        noExternal: [
            "@mui/icons-material",
            "@mui/x-data-grid"
        ]
    },
    plugins: [
        reactRouter(),
        tsconfigPaths()
    ]
}));
