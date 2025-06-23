import { Authenticator } from "remix-auth";
import { MicrosoftStrategy } from "remix-auth-microsoft";
import { redirect } from "@remix-run/node";

import { sessionStorage } from "./session.server";
import { BidderService, AuthenticatedBidder, BidderWithAdmin } from "./users.server";
import { DateTime } from "luxon";

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

export type BidderAuthentication = {
    bidder: AuthenticatedBidder,
    authenticatedAt: string
};

export type FullBidderAuthentication = BidderAuthentication & {
    fullBidder: BidderWithAdmin
};

export type AuthenticatedBidderOptions = {
    mustBeAdmin?: boolean,
    withFullBidder?: boolean
};

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
    async ({ profile }): Promise<BidderAuthentication> => {
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

        // Trying to store the least amount of data in the session to placate cookie size limits
        const bidder = await BidderService.findOrCreate({
            profileId: profile.id, 
            displayName: profile.displayName,
            emailAddress: profile.emails[0]?.value,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName
        });

        return {
            authenticatedAt: DateTime.now().toISO(),
            bidder: { 
                id: bidder.id, 
                windowsId: bidder.windowsId, 
                adminAssignment: bidder.adminAssignment
            }
        };
    }
);
authenticator.use(microsoftStrategy);

export function getAuthenticatedBidder(request: Request, options: { withFullBidder: true } & AuthenticatedBidderOptions): Promise<FullBidderAuthentication | undefined>;
export function getAuthenticatedBidder(request: Request, options?: AuthenticatedBidderOptions): Promise<BidderAuthentication | undefined>;
export async function getAuthenticatedBidder(request: Request, options?: AuthenticatedBidderOptions): Promise<BidderAuthentication | FullBidderAuthentication | undefined> {
    try {
        const authentication = await authenticator.isAuthenticated(request);
        if (!authentication) {
            return undefined;
        }

        if (options?.mustBeAdmin && !authentication.bidder.adminAssignment) {
            return undefined;
        }

        if (options?.withFullBidder) {
            const fullBidder = await BidderService.getById(authentication.bidder.id);
            if (!fullBidder) {
                return undefined;
            }
            
            return {
                ...authentication,
                fullBidder
            };
        }
        
        return authentication;
    } catch (error) {
        console.error(error);
        return undefined;
    }
};

export function requireAuthenticatedBidder(request: Request, options: { withFullBidder: true } & AuthenticatedBidderOptions): Promise<FullBidderAuthentication>;
export function requireAuthenticatedBidder(request: Request, options?: AuthenticatedBidderOptions): Promise<BidderAuthentication>;
export async function requireAuthenticatedBidder(request: Request, options?: AuthenticatedBidderOptions): Promise<BidderAuthentication | FullBidderAuthentication> {
    const authentication = await authenticator.isAuthenticated(request);
    if (!authentication) {
        throw redirect("/login");
    }

    if (options?.mustBeAdmin && !authentication.bidder.adminAssignment) {
        throw redirect("/");
    }

    if (options?.withFullBidder) {
        const fullBidder = await BidderService.getById(authentication.bidder.id);
        if (!fullBidder) {
            throw redirect("/");
        }
        
        return {
            ...authentication,
            fullBidder
        };
    }
    
    return authentication;
};