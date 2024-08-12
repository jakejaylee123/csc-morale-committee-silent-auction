import { vitePlugin as remix } from "@remix-run/dev";

import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

import fs from "fs";
import path from "path";

const staticResolutions: { [key: string]: string } = {
    "@mui/x-date-pickers/AdapterLuxon": `${__dirname}/node_modules/@mui/x-date-pickers/AdapterLuxon/AdapterLuxon.js`
};

export default defineConfig({
    plugins: [
        remix({
            future: {
                v3_fetcherPersist: true,
                v3_relativeSplatPath: true,
                v3_throwAbortReason: true,
            },
        }),
        tsconfigPaths(),
    ],
    resolve: {
        alias: process.env.NODE_ENV === "development" ? [] : [{
            find: "@mui",
            replacement: "@mui",
            customResolver: function (this, source): string | null {
                if (!source) return null;

                if (Object.hasOwn(staticResolutions, source)) {
                    return staticResolutions[source];
                }

                const searchDirectory = `${__dirname}/node_modules/${source}`;
                const indexFile = `${searchDirectory}/index.js`;
                if (fs.existsSync(indexFile)) {
                    return indexFile;
                }

                const parentDirectory = path.basename(searchDirectory);
                const parentIndexFile = `${parentDirectory}/index.js`;
                if (fs.existsSync(parentIndexFile)) {
                    return parentIndexFile;
                }

                return null;
            }
        }]
    }
});
