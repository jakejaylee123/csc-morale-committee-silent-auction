import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticator } from "~/services/auth.server";
import { redirect } from "@remix-run/node";

export function loader() { return redirect("/login"); };

export async function action({ request }: ActionFunctionArgs) {
    return await authenticator.authenticate("microsoft", request);
};