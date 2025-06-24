import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticator } from "~/services/auth.server";
import { redirect } from "@remix-run/node";

export function loader() {
    return redirect("/login");
}

export function action({ request }: ActionFunctionArgs) {
    return authenticator.authenticate("microsoft", request);
};