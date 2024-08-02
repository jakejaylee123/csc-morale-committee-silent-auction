import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { RemixBrowser } from "@remix-run/react";

import { CacheProvider } from "@emotion/react";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";

import { ClientStyleContext } from "./components/ClientStyleContext";
import { createEmotionCache } from "./components/helpers/createEmotionCache";

import { theme } from "./theme";

interface ClientCacheProviderProps {
    children: React.ReactNode;
}
function ClientCacheProvider({ children }: ClientCacheProviderProps) {
    const [cache, setCache] = React.useState(createEmotionCache());

    const clientStyleContextValue = React.useMemo(
        () => ({
            reset() {
                setCache(createEmotionCache());
            },
        }),
        [],
    );

    return (
        <ClientStyleContext.Provider value={clientStyleContextValue}>
            <CacheProvider value={cache}>{children}</CacheProvider>
        </ClientStyleContext.Provider>
    );
}

const hydrate = () => {
    React.startTransition(() => {
        ReactDOM.hydrateRoot(
            document,
            <ClientCacheProvider>
                <ThemeProvider theme={theme}>
                    <CssBaseline />
                    <RemixBrowser />
                </ThemeProvider>
            </ClientCacheProvider>,
        );
    });
};

if (window.requestIdleCallback) {
    window.requestIdleCallback(hydrate);
} else {
    // Safari doesn"t support requestIdleCallback
    // https://caniuse.com/requestidlecallback
    setTimeout(hydrate, 1);
}