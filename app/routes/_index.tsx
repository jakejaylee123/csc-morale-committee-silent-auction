import type { LoaderFunctionArgs } from "@remix-run/node";
import { MetaFunction, useLoaderData } from "@remix-run/react";

import { Dashboard } from "~/components/Dashboard";
import { requireAuthenticatedBidder } from "~/services/auth.server";
import { EventService, EventWithConvenience } from "~/services/event.server";
import { GleamingHeader } from "~/components/GleamingHeader";
import { BidderWithAdmin } from "~/services/users.server";
import { APP_NAME, Dto } from "~/commons/general.common";

type IndexLoaderFunctionData = Dto<{
    bidder: BidderWithAdmin,
    events: EventWithConvenience[]
}>;

export const loader = async function ({ request }: LoaderFunctionArgs): Promise<IndexLoaderFunctionData> {
    const { fullBidder } = await requireAuthenticatedBidder(request, {
        withFullBidder: true
    });

    return {
        bidder: fullBidder,
        events: await EventService.getEnabledActiveAndPast()
    };
};

export const meta: MetaFunction<typeof loader> = function (_) {
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
