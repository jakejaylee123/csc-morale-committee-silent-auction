import { Authenticator } from "remix-auth";
import { MicrosoftStrategy } from "remix-auth-microsoft";
import { redirect, SerializeFrom } from "@remix-run/node";

import { sessionStorage } from "./session.server";
import { BidderService, BidderWithAdmin } from "./users.server";

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            MEID_CLIENT_ID: string,
            MEID_CLIENT_SECRET: string,
            MEID_AUTH_REDIRECT_URI: string,
            MEID_TENANT_ID: string
        }
    }
};

export interface BidderAuthentication {
    accessToken: string,
    bidder: BidderWithAdmin
};
export type SerializedBidderAuthentication = SerializeFrom<BidderAuthentication>;

export const authenticator = new Authenticator<BidderAuthentication>(sessionStorage); //User is a custom user types you can define as you want
const microsoftStrategy = new MicrosoftStrategy(
    {
        clientId: process.env.MEID_CLIENT_ID,
        clientSecret: process.env.MEID_CLIENT_SECRET,
        redirectUri: process.env.MEID_AUTH_REDIRECT_URI,
        tenantId: process.env.MEID_TENANT_ID, // optional - necessary for organization without multitenant (see below)
        scope: "openid profile email", // optional
        prompt: "login", // optional
    },
    async ({ accessToken, extraParams, profile }) => {
        // Here you can fetch the user from database or return a user object based on profile
        // return {profile}
        // The returned object is stored in the session storage you are using by the authenticator

        // If you"re using cookieSessionStorage, be aware that cookies have a size limit of 4kb
        // For example this won"t work
        // return {accessToken, extraParams, profile}

        // Retrieve or create user using id received from userinfo endpoint
        // https://graph.microsoft.com/oidc/userinfo

        // DO NOT USE EMAIL ADDRESS TO IDENTIFY USERS
        // The email address received from Microsoft Entra ID is not validated and can be changed to anything from Azure Portal.
        // If you use the email address to identify users and allow signing in from any tenant (`tenantId` is not set)
        // it opens up a possibility of spoofing users!
        console.log(JSON.stringify(profile, undefined, 4));

        return {
            accessToken,
            bidder: await BidderService.findOrCreate({ 
                profileId: profile.id, 
                displayName: profile.displayName,
                emailAddress: profile.emails[0]?.value,
                firstName: profile.name.givenName,
                lastName: profile.name.familyName
            })
        } satisfies BidderAuthentication;
    }
);
authenticator.use(microsoftStrategy);


export interface AuthenticatedBidderOptions {
    mustBeAdmin?: boolean,
    noSessionCheck?: boolean
};

const defaultifyAuthenticationBidderOptions = function (options?: AuthenticatedBidderOptions): AuthenticatedBidderOptions {
    return {
        mustBeAdmin: options?.mustBeAdmin || false,
        noSessionCheck: options?.noSessionCheck || false
    };
};

export const getAuthenticatedBidder = async function (request: Request): Promise<BidderAuthentication | undefined> {
    try {
        return await authenticator.authenticate("microsoft", request);
    } catch (error: any) {
        return undefined;
    }
};

export const requireAuthenticatedBidder = async function (request: Request, options?: AuthenticatedBidderOptions): Promise<BidderAuthentication> {
    options = defaultifyAuthenticationBidderOptions(options);

    if (!options.noSessionCheck && !sessionStorage) {
        throw redirect("/login");
    }

    const authentication = await authenticator.authenticate("microsoft", request, {
        failureRedirect: "/login",
    });

    if (options.mustBeAdmin && !authentication.bidder.adminAssignment) {
        throw redirect("/");
    }

    return authentication;
};