import type { LoaderFunction, SerializeFrom } from "@remix-run/node";
import { json, MetaFunction, useLoaderData } from "@remix-run/react";

import { requireAuthenticatedBidder } from "~/services/auth.server";
import { EventService, EventWithConvenience } from "~/services/event.server";
import { APP_NAME, Identifiers } from "~/commons/general.common";
import { GleamingHeader } from "~/components/GleamingHeader";
import { CategoryService } from "~/services/category.server";
import { CategoryCode, Event } from "@prisma/client";
import { BidService, BidWithItem } from "~/services/bid.server";
import { Winnings } from "~/components/Winnings";
import { EventCommon } from "~/commons/event.common";

type EventWinningsLoaderFunctionData = {
    success: true,
    bidderId: number,
    event: Event,
    categories: CategoryCode[],
    winningBids: BidWithItem[]
} | {
    success: false,
    error: string
};
type SerializedEventWinningsLoaderFunctionData = SerializeFrom<EventWinningsLoaderFunctionData>;

export const loader = async function ({ request, params }) {
    const { bidder } = await requireAuthenticatedBidder(request);
    
    const { id } = params;
    const event = Identifiers.isIntegerId(id)
        ? await EventService.get(parseInt(id))
        : null;

    if (!event) {
        return json({
            success: false,
            error: `Event "${id}" was not found.`
        } satisfies EventWinningsLoaderFunctionData);
    } else if (!EventCommon.isEnabledAndConcluded(event)) {
        return json({
            success: false,
            error: `The event "${event.description}" is either disabled or not yet concluded.`
        } satisfies EventWinningsLoaderFunctionData);
    } else if (!event.releaseWinners) {
        return json({
            success: false,
            error: `The winners for event "${event.description}" have not been released.`
        } satisfies EventWinningsLoaderFunctionData);
    }

    return json({
        success: true,
        bidderId: bidder.id,
        event: event,
        categories: await CategoryService.getAll(),
        winningBids: await BidService.getWinning({ 
            forEventId: event.id, 
            forBidderId: bidder.id,
            withItem: true
        })
    } satisfies EventWinningsLoaderFunctionData);
} satisfies LoaderFunction;

export const meta: MetaFunction<typeof loader> = function ({ data }) {
    return [{ title: `${APP_NAME}: Event winnings` }];
};

export default function EventWinnings() {
    const result = useLoaderData<typeof loader>() satisfies SerializedEventWinningsLoaderFunctionData;
    if (!result?.success) {
        return (
            <>
                <GleamingHeader
                    title="Unable to view auction winnings"
                    description={result.error}
                />
            </>
        );
    }
    
    return (
        <>
            <GleamingHeader
                title={result.event.description}
                titleVariant="h4"
                description=""
            />
            <Winnings {...result} />
        </>
    );
}
