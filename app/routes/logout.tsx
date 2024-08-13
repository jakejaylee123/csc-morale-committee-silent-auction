import { LoaderFunction, redirect } from "@remix-run/node";

import { SESSION_COOKIE_HEADER, sessionStorage } from "~/services/session.server";

export const loader: LoaderFunction = async function (_) {
    const session = await sessionStorage.getSession(SESSION_COOKIE_HEADER);
    return redirect("/login", {
        headers: {
            "Set-Cookie": await sessionStorage.destroySession(session)
        }
    });
};