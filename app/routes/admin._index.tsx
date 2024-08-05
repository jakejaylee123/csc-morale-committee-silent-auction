import type { LoaderFunction } from "@remix-run/node";
import { json, useLoaderData } from "@remix-run/react";

import { Event } from "@prisma/client";

import { AdminDashboard } from "~/components/AdminDashboard";
import { requireAuthenticatedBidder } from "~/services/auth.server";
import { EventService, SerializedEvent } from "~/services/event.server";
import { GleamingHeader } from "~/components/GleamingHeader";

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
        events: await EventService.getActive()
    } satisfies AdminLoaderFunctionData;

    return json(data);
} satisfies LoaderFunction;

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
