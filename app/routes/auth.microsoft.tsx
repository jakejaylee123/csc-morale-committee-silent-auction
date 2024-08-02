import type { ActionFunction } from "@remix-run/node";
import { authenticator } from "~/services/auth.server";
import { redirect } from "@remix-run/node";

export const loader = () => redirect("/login");

export const action: ActionFunction = ({ request }) => {
    return authenticator.authenticate("microsoft", request);
};