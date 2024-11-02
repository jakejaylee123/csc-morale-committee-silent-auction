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
    Experimental_CssVarsProvider as CssVarsProvider, 
    useColorScheme 
} from "@mui/material/styles";

import theme from "./theme";

import { getMuiLinks } from "./components/getMuiLinks";
import { MuiDocument } from "./components/MuiDocument";

import { DefaultTransition } from "./components/DefaultTransition";
import { InitColorSchemeScript } from "./components/danger/InitColorSchemeScript";
import { NavigationBar } from "./components/NavigationBar";
import { Footer } from "./components/Footer";

import {
    BidderAuthentication,
    getAuthenticatedBidder,
    SerializedBidderAuthentication
} from "./services/auth.server";

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
        <html lang="en" data-mui-color-scheme={colorSchemeState.mode}>
            <head suppressHydrationWarning>
                <meta charSet="utf-8" suppressHydrationWarning />
                <meta name="viewport" content="width=device-width,initial-scale=1" suppressHydrationWarning />
                {title ? <title>{title}</title> : null}
                <Meta />
                {/* <MuiMeta /> */}
                <Links />
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
                <DefaultTransition>
                    {children}
                </DefaultTransition>
                <Footer />
                <ScrollRestoration />
                <Scripts />
            </body>
        </html>
    );
}

export function Layout({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <CssVarsProvider theme={theme}>
            <LayoutInner
                title={title}
                children={children} />
        </CssVarsProvider>
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