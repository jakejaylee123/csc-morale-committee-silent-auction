import { vitePlugin as remix } from "@remix-run/dev";

import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

declare module "@remix-run/server-runtime" {
    interface Future {
        v3_singleFetch: true;
    }
}

export default defineConfig({
    server: {
        port: 8080,
    },
    ssr: {
        noExternal: [
            "@mui/icons-material",
            "@mui/x-data-grid"
        ]
    },
    plugins: [
        tsconfigPaths(),
        remix({
            future: {
                v3_fetcherPersist: true,
                v3_relativeSplatPath: true,
                v3_throwAbortReason: true,
                v3_singleFetch: true
            },
        })
    ]
});
