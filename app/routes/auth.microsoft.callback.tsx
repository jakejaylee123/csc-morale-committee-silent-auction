import { LoaderFunctionArgs, redirect } from "react-router";
import { authenticator } from "~/services/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
    try {
        return authenticator.authenticate("microsoft", request, {
            successRedirect: "/",
            throwOnError: true
        });
    } catch (error) {
        console.log("Error finalizing login for user: ", error);
        return redirect("/login");
    }
};