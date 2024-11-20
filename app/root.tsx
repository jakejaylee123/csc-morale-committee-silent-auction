import {
    LoaderFunction,
    LinksFunction
} from "@remix-run/node";
import {
    Links,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
    json,
    useLoaderData
} from "@remix-run/react";

import {
    ThemeProvider,
    useColorScheme
} from "@mui/material/styles";

import theme from "./theme";

import { getMuiLinks } from "./components/getMuiLinks";
import { MuiDocument } from "./components/MuiDocument";

import { DefaultTransition } from "./components/DefaultTransition";
import InitColorSchemeScript from "./components/danger/InitColorSchemeScript";
import { NavigationBar } from "./components/NavigationBar";
import { Footer } from "./components/Footer";

import {
    BidderAuthentication,
    getAuthenticatedBidder,
    SerializedBidderAuthentication
} from "./services/auth.server";
import { Stack } from "@mui/material";

export interface RootLoaderFunctionData {
    authentication?: BidderAuthentication
};
export interface SerializedRootLoaderFunctionData {
    authentication?: SerializedBidderAuthentication
};

export const links: LinksFunction = () => [...getMuiLinks()];

export const loader = async function ({ request }) {
    const authentication = await getAuthenticatedBidder(request);
    const data = {
        authentication
    } satisfies RootLoaderFunctionData;

    return json(data);
} satisfies LoaderFunction;

function LayoutInner({ title, children }: { title: string, children: React.ReactNode }) {
    const colorSchemeState = useColorScheme();

    const loaderData = useLoaderData() satisfies SerializedRootLoaderFunctionData;
    const authentication = loaderData?.authentication;

    return (
        <html lang="en" data-mui-color-scheme={colorSchemeState.mode} suppressHydrationWarning>
            <head suppressHydrationWarning>
                <meta charSet="utf-8" suppressHydrationWarning />
                <meta name="viewport" content="width=device-width,initial-scale=1" suppressHydrationWarning />
                {title ? <title>{title}</title> : null}
                <Meta />
                <Links />
                <meta name="emotion-insertion-point" content="emotion-insertion-point" suppressHydrationWarning />
            </head>
            <body>
                <Scripts />
                <InitColorSchemeScript />
                <NavigationBar
                    bidder={authentication?.bidder}
                    colorSchemeState={colorSchemeState}
                />
                <DefaultTransition>
                    {children}
                </DefaultTransition>
                <Stack sx={{ marginBottom: 100 }} />
                <Footer />
                <ScrollRestoration />
            </body>
        </html>
    );
}

export function Layout({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <ThemeProvider theme={theme}>
            <LayoutInner
                title={title}
                children={children} />
        </ThemeProvider>
    );
}

export default function App() {
    return (
        <>
            <MuiDocument>
                <Outlet />
            </MuiDocument>
        </>
    );
}