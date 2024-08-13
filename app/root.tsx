import * as React from "react";
import {
    Links,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
    useRouteError,
    isRouteErrorResponse,
    json,
    useLoaderData,
} from "@remix-run/react";

import { withEmotionCache } from "@emotion/react";
import {
    CssBaseline,
    unstable_useEnhancedEffect as useEnhancedEffect,
} from "@mui/material";

import { Experimental_CssVarsProvider as CssVarsProvider, useColorScheme } from "@mui/material/styles";
import { theme } from "./theme";

import { InitColorSchemeScript } from "./components/danger/InitColorSchemeScript";

import { ClientStyleContext } from "./components/ClientStyleContext";
import { Layout } from "./components/Layout";
import { NavigationBar } from "./components/NavigationBar";

interface DocumentProps {
    children: React.ReactNode;
    title?: string;
}

import {
    BidderAuthentication,
    getAuthenticatedBidder,
    SerializedBidderAuthentication
} from "./services/auth.server";
import { LoaderFunction } from "@remix-run/node";
import { Footer } from "./components/Footer";

export interface RootLoaderFunctionData {
    authentication?: BidderAuthentication
};
export interface SerializedRootLoaderFunctionData {
    authentication?: SerializedBidderAuthentication
};

export const loader = async function ({ request }) {
    const authentication = await getAuthenticatedBidder(request);
    const data = {
        authentication
    } satisfies RootLoaderFunctionData;

    return json(data);
} satisfies LoaderFunction;

const Document = withEmotionCache(({ children, title }: DocumentProps, emotionCache) => {
    const clientStyleData = React.useContext(ClientStyleContext);
    const colorSchemeState = useColorScheme();
    
    const loaderData = useLoaderData() satisfies SerializedRootLoaderFunctionData;
    const authentication = loaderData?.authentication;

    // Only executed on client
    useEnhancedEffect(() => {
        // re-link sheet container
        emotionCache.sheet.container = document.head;

        // re-inject tags
        const tags = emotionCache.sheet.tags;
        emotionCache.sheet.flush();
        tags.forEach((tag) => {
            // eslint-disable-next-line no-underscore-dangle
            (emotionCache.sheet as any)._insertTag(tag);
        });

        // reset cache to reapply global styles
        clientStyleData.reset();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <html lang="en" data-mui-color-scheme={colorSchemeState.mode}>
            <head suppressHydrationWarning>
                <meta charSet="utf-8" suppressHydrationWarning />
                <meta name="viewport" content="width=device-width,initial-scale=1" suppressHydrationWarning />
                {title ? <title>{title}</title> : null}
                <Meta />
                <Links />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
                <link
                    rel="stylesheet"
                    href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap"
                />
                <meta name="emotion-insertion-point" content="emotion-insertion-point" suppressHydrationWarning />
            </head>
            <body>
                <InitColorSchemeScript 
                    modeStorageKey="mui-mode" 
                    attribute="data-mui-color-scheme"
                />
                <NavigationBar 
                    bidder={authentication?.bidder} 
                    colorSchemeState={colorSchemeState}
                />
                {children}
                <Footer />
                <ScrollRestoration />
                <Scripts />
            </body>
        </html>
    );
});

export default function App() {
    const loaderData = useLoaderData() satisfies SerializedRootLoaderFunctionData;
    const authentication = loaderData?.authentication;

    return (
        <CssVarsProvider theme={theme}>
            <CssBaseline />
            <Document>
                <Layout>
                    
                    <Outlet />
                </Layout>
            </Document>
        </CssVarsProvider>
    );
}

export function ErrorBoundary() {
    const error = useRouteError();

    if (isRouteErrorResponse(error)) {
        let message;
        switch (error.status) {
            case 401:
                message = <p>Oops! Looks like you tried to visit a page that you do not have access to.</p>;
                break;
            case 404:
                message = <p>Oops! Looks like you tried to visit a page that does not exist.</p>;
                break;

            default:
                throw new Error(error.data || error.statusText);
        }

        return (
            <Document title={`${error.status} ${error.statusText}`}>
                <Layout>
                    <h1>
                        {error.status}: {error.statusText}
                    </h1>
                    {message}
                </Layout>
            </Document>
        );
    }

    if (error instanceof Error) {
        console.error(error);
        return (
            <Document title="Error!">
                <Layout>
                    <div>
                        <h1>There was an error</h1>
                        <p>{error.message}</p>
                        <hr />
                        <p>Hey, developer, you should replace this with what you want your users to see.</p>
                    </div>
                </Layout>
            </Document>
        );
    }

    return <h1>Unknown Error</h1>;
}