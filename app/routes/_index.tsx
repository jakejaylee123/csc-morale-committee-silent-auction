import type { LoaderFunction } from "@remix-run/node";
import { json, MetaFunction, useLoaderData } from "@remix-run/react";

import { Dashboard } from "~/components/Dashboard";
import { requireAuthenticatedBidder } from "~/services/auth.server";
import { EventService, EventWithConvenience, SerializedEvent } from "~/services/event.server";
import { GleamingHeader } from "~/components/GleamingHeader";
import { BidderWithAdmin, SerializedBidderWithAdmin } from "~/services/users.server";
import { APP_NAME } from "~/commons/general.common";

interface IndexLoaderFunctionData {
    bidder: BidderWithAdmin,
    events: EventWithConvenience[]
};
interface SerializedIndexLoaderFunctionData {
    bidder: SerializedBidderWithAdmin,
    events: SerializedEvent[]
};

export const loader = async function ({ request }) {
    const { fullBidder } = await requireAuthenticatedBidder(request, {
        withFullBidder: true
    });

    const data = {
        bidder: fullBidder,
        events: await EventService.getEnabledActiveAndPast()
    } satisfies IndexLoaderFunctionData;

    return json(data);
} satisfies LoaderFunction;

export const meta: MetaFunction<typeof loader> = function ({ data }) {
    return [{ title: `${APP_NAME}: Dashboard` }];
};

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
