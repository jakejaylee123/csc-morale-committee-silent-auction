import { createCookieSessionStorage } from "@remix-run/node";

export const SESSION_COOKIE_HEADER = "_session";

const sessionStoragePrecursor = createCookieSessionStorage({
    cookie: {
        name: SESSION_COOKIE_HEADER, // use any name you want here
        sameSite: "lax", // this helps with CSRF
        path: "/", // remember to add this so the cookie will work in all routes
        httpOnly: true, // for security reasons, make this cookie http only
        secrets: ["s3cr3t"], // replace this with an actual secret
        secure: process.env.NODE_ENV === "production", // enable this in prod only
    },
});

// We use the default get, commit, and destroy session functions here,
// but we wrap them in a customer call so that you have the ability to add
// code for debugging (e.g. logging the session info to figure out why your
// session information is too long).

const defaultGetSession = sessionStoragePrecursor.getSession;
sessionStoragePrecursor.getSession = async function(cookieHeader, options) {
    return defaultGetSession(cookieHeader, options);
};

const defaultCommitSession = sessionStoragePrecursor.commitSession;
sessionStoragePrecursor.commitSession = async function(session, options) {
    return defaultCommitSession(session, options);
};

const defaultDestroySession = sessionStoragePrecursor.destroySession;
sessionStoragePrecursor.destroySession = async function(session, options) {
    return defaultDestroySession(session, options);
};

export const sessionStorage = sessionStoragePrecursor;