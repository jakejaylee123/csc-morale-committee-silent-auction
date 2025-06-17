import {
    LinksFunction,
    LoaderFunctionArgs
} from "@remix-run/node";
import {
    Links,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
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
    FullBidderAuthentication,
    getAuthenticatedBidder
} from "./services/auth.server";

import Stack from "@mui/material/Stack";

export interface RootLoaderFunctionData {
    authentication?: FullBidderAuthentication
};

export const links: LinksFunction = () => [...getMuiLinks()];

export async function loader({ request }: LoaderFunctionArgs): Promise<RootLoaderFunctionData> {
    const authentication = await getAuthenticatedBidder(request, {
        withFullBidder: true
    });

    return {
        authentication
    };
};

function LayoutInner({ title, children }: { title: string, children: React.ReactNode }) {
    const colorSchemeState = useColorScheme();

    const loaderData = useLoaderData<typeof loader>();
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
                    bidder={authentication?.fullBidder}
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