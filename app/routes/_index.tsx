import type { LoaderFunction } from "@remix-run/node";
import { json, useLoaderData } from "@remix-run/react";

import { Event } from "@prisma/client";

import { Dashboard } from "~/components/Dashboard";
import { requireAuthenticatedBidder } from "~/services/auth.server";
import { EventService, SerializedEvent } from "~/services/event.server";
import { GleamingHeader } from "~/components/GleamingHeader";

interface IndexLoaderFunctionData {
    events: Event[]
};
interface SerializedIndexLoaderFunctionData {
    events: SerializedEvent[]
};

export const loader = async function ({ request }) {
    await requireAuthenticatedBidder(request);
    const data = {
        events: await EventService.getActive()
    } satisfies IndexLoaderFunctionData;

    return json(data);
} satisfies LoaderFunction;

export default function Index() {
    const { events } = useLoaderData<typeof loader>() satisfies SerializedIndexLoaderFunctionData;

    return (
        <>
            <GleamingHeader
                title="Welcome!"
                description=""
            />
            <Dashboard
                events={events}
            />
        </>
    );
}
