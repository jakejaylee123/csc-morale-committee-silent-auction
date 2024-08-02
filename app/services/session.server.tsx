import { createCookieSessionStorage } from "@remix-run/node";

export const SESSION_COOKIE_HEADER = "_session";

export const sessionStorage = createCookieSessionStorage({
    cookie: {
        name: SESSION_COOKIE_HEADER, // use any name you want here
        sameSite: "lax", // this helps with CSRF
        path: "/", // remember to add this so the cookie will work in all routes
        httpOnly: true, // for security reasons, make this cookie http only
        secrets: ["s3cr3t"], // replace this with an actual secret
        secure: process.env.NODE_ENV === "production", // enable this in prod only
    },
});