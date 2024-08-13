import { GleamingHeader } from "~/components/GleamingHeader";
import { LoginWithMicrosoft } from "~/components/LoginWithMicrosoft";

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