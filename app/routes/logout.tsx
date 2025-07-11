import { redirect } from "react-router";

import { SESSION_COOKIE_HEADER, sessionStorage } from "~/services/session.server";

export async function loader() {
    const session = await sessionStorage.getSession(SESSION_COOKIE_HEADER);
    return redirect("/login", {
        headers: {
            "Set-Cookie": await sessionStorage.destroySession(session)
        }
    });
};