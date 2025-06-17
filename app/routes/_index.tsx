import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { Dashboard } from "~/components/Dashboard";
import { requireAuthenticatedBidder } from "~/services/auth.server";
import { BidderWithAdmin } from "~/services/users.server";
import { EventService, EventWithConvenience } from "~/services/event.server";
import { GleamingHeader } from "~/components/GleamingHeader";
import { APP_NAME } from "~/commons/general.common";

interface IndexLoaderFunctionData {
    bidder: BidderWithAdmin,
    events: EventWithConvenience[]
};

export async function loader({ request }: LoaderFunctionArgs): Promise<IndexLoaderFunctionData> {
    const { fullBidder } = await requireAuthenticatedBidder(request, {
        withFullBidder: true
    });

    return {
        bidder: fullBidder,
        events: await EventService.getEnabledActiveAndPast()
    };
};

export function meta() {
    return [{ title: `${APP_NAME}: Dashboard` }];
};

export default function Index() {
    const { events, bidder } = useLoaderData<typeof loader>();

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
