import type { LoaderFunction, SerializeFrom } from "@remix-run/node";
import { json, useLoaderData } from "@remix-run/react";

import { requireAuthenticatedBidder } from "~/services/auth.server";
import { EventService } from "~/services/event.server";
import { Identifiers } from "~/commons/general.common";
import { GleamingHeader } from "~/components/GleamingHeader";
import { CategoryService } from "~/services/category.server";
import { CategoryCode, Event } from "@prisma/client";
import { BidService, BidWithItem } from "~/services/bid.server";
import { Winnings } from "~/components/Winnings";

type EventWinningsLoaderFunctionData = {
    success: true,
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
    const event = await (async () => {
        if (Identifiers.isIntegerId(id)) {
            return await EventService.get(parseInt(id)) as Event;
        } else {
            return null;
        }
    })() satisfies Event | null;

    if (!event) {
        return json({
            success: false,
            error: `Event "${id}" was not found.`
        } satisfies EventWinningsLoaderFunctionData);
    } else if (!EventService.isEnabledAndConcluded(event)) {
        return json({
            success: false,
            error: `The auction event "${event.description}"is either disabled or not yet concluded.`
        } satisfies EventWinningsLoaderFunctionData);
    }

    return json({
        success: true,
        event: event,
        categories: await CategoryService.getAll(),
        winningBids: await BidService.getWinning({ eventId: event.id, bidderId: bidder.id })
    } satisfies EventWinningsLoaderFunctionData);
} satisfies LoaderFunction;

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
