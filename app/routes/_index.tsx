import type { LoaderFunction } from "@remix-run/node";
import { json, useLoaderData } from "@remix-run/react";

import { Event } from "@prisma/client";

import { Dashboard } from "~/components/Dashboard";
import { requireAuthenticatedBidder } from "~/services/auth.server";
import { EventService, SerializedEvent } from "~/services/event.server";
import { GleamingHeader } from "~/components/GleamingHeader";
import { BidderWithAdmin, SerializedBidderWithAdmin } from "~/services/users.server";

interface IndexLoaderFunctionData {
    bidder: BidderWithAdmin,
    events: Event[]
};
interface SerializedIndexLoaderFunctionData {
    bidder: SerializedBidderWithAdmin,
    events: SerializedEvent[]
};

export const loader = async function ({ request }) {
    const { bidder } = await requireAuthenticatedBidder(request);
    const data = {
        bidder,
        events: await EventService.getActive()
    } satisfies IndexLoaderFunctionData;

    return json(data);
} satisfies LoaderFunction;

export default function Index() {
    const { events, bidder } = useLoaderData<typeof loader>() satisfies SerializedIndexLoaderFunctionData;

    return (
        <>
            <GleamingHeader
                title={`Welcome, ${bidder.firstName}!`}
                description=""
            />
            <Dashboard
                events={events}
            />
        </>
    );
}
