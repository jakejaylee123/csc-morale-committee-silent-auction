import type { LoaderFunction } from "@remix-run/node";
import { json, MetaFunction, useLoaderData } from "@remix-run/react";

import { Event } from "@prisma/client";

import { AdminDashboard } from "~/components/AdminDashboard";
import { requireAuthenticatedBidder } from "~/services/auth.server";
import { EventService, SerializedEvent } from "~/services/event.server";
import { GleamingHeader } from "~/components/GleamingHeader";
import { APP_NAME } from "~/commons/general.common";

interface AdminLoaderFunctionData {
    events: Event[]
};
interface SerializedAdminLoaderFunctionData {
    events: SerializedEvent[]
};

export const loader = async function ({ request }) {
    await requireAuthenticatedBidder(request, {
        mustBeAdmin: true
    });
    
    const data = {
        events: await EventService.getAll()
    } satisfies AdminLoaderFunctionData;

    return json(data);
} satisfies LoaderFunction;

export const meta: MetaFunction<typeof loader> = function ({ data }) {
    return [{ title: `${APP_NAME}: Administration` }];
};

export default function Admin() {
    const { events } = useLoaderData<typeof loader>() satisfies SerializedAdminLoaderFunctionData;
    
    return (
        <>
            <GleamingHeader
                title="Welcome!"
                description=""
            />
            <AdminDashboard
                events={events}
            />
        </>
    );
}
