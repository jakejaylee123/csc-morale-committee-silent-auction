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

import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";

import {
    ThemeProvider,
    useColorScheme,
} from "@mui/material/styles";

import theme from "./theme";

import { getMuiLinks } from "./components/getMuiLinks";
import { MuiDocument } from "./components/MuiDocument";

import { DefaultTransition } from "./components/DefaultTransition";
import { NavigationBar } from "./components/NavigationBar";
import { Footer } from "./components/Footer";

import {
    FullBidderAuthentication,
    getAuthenticatedBidder,
    SerializedFullBidderAuthentication
} from "./services/auth.server";

import Stack from "@mui/material/Stack";

export interface RootLoaderFunctionData {
    authentication?: FullBidderAuthentication
};
export interface SerializedRootLoaderFunctionData {
    authentication?: SerializedFullBidderAuthentication
};

export const links: LinksFunction = () => [...getMuiLinks()];

export const loader = async function ({ request }) {
    const authentication = await getAuthenticatedBidder(request, {
        withFullBidder: true
    });
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
        <html lang="en" suppressHydrationWarning>
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width,initial-scale=1" />
                {title ? <title>{title}</title> : null}
                <Meta />
                <Links />
            </head>
            <body>
                <Scripts />
                <InitColorSchemeScript defaultMode={colorSchemeState.mode} />
                <NavigationBar bidder={authentication?.fullBidder} />
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