import { redirect, type LoaderFunction } from "@remix-run/node";
import { authenticator } from "~/services/auth.server";

export const loader: LoaderFunction = ({ request }) => {
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