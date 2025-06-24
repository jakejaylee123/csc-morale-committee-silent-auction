import type { ActionFunctionArgs } from "react-router";
import { authenticator } from "~/services/auth.server";
import { redirect } from "react-router";

export function loader() {
    return redirect("/login");
}

export function action({ request }: ActionFunctionArgs) {
    return authenticator.authenticate("microsoft", request);
};