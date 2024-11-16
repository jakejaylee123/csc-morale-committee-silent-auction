import { MetaFunction } from "@remix-run/react";

import { APP_NAME } from "~/commons/general.common";

import { GleamingHeader } from "~/components/GleamingHeader";
import { LoginWithMicrosoft } from "~/components/LoginWithMicrosoft";

export const meta: MetaFunction = function () {
    return [{ title: `${APP_NAME}: Login` }];
};

export default function Login() {
    return (
        <>
            <GleamingHeader
                title="Welcome CSC Morale Committee Silent Auction Area!"
                description="Sign into your Microsoft work account to continue to your bidding dashboard."
            />
            <LoginWithMicrosoft />
        </>
    );
}