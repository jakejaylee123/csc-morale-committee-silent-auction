import { APP_NAME } from "~/commons/general.common";

import { GleamingHeader } from "~/components/GleamingHeader";
import { LoginWithMicrosoft } from "~/components/LoginWithMicrosoft";

export function meta() {
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