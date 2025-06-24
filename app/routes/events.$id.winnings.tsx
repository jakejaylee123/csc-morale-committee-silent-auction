import type { LoaderFunctionArgs } from "react-router";
import { MetaFunction, useLoaderData } from "react-router";

import { requireAuthenticatedBidder } from "~/services/auth.server";
import { EventService, EventWithConvenience } from "~/services/event.server";
import { APP_NAME, Dto, Identifiers } from "~/commons/general.common";
import { GleamingHeader } from "~/components/GleamingHeader";
import { CategoryService } from "~/services/category.server";
import { CategoryCode } from "@prisma/client";
import { BidService, BidWithItem } from "~/services/bid.server";
import { Winnings } from "~/components/Winnings";
import { EventCommon } from "~/commons/event.common";

type EventWinningsLoaderFunctionData = {
    success: true,
    bidderId: number,
    event: Dto<EventWithConvenience>,
    categories: Dto<CategoryCode>[],
    winningBids: Dto<BidWithItem>[]
} | {
    success: false,
    error: string
};

export async function loader({ request, params }: LoaderFunctionArgs): Promise<EventWinningsLoaderFunctionData> {
    const { bidder } = await requireAuthenticatedBidder(request);
    
    const { id } = params;
    const event = Identifiers.isIntegerId(id)
        ? await EventService.get(parseInt(id))
        : null;

    if (!event) {
        return {
            success: false,
            error: `Event "${id}" was not found.`
        };
    } else if (!EventCommon.isEnabledAndConcluded(event)) {
        return {
            success: false,
            error: `The event "${event.description}" is either disabled or not yet concluded.`
        };
    } else if (!event.releaseWinners) {
        return {
            success: false,
            error: `The winners for event "${event.description}" have not been released.`
        };
    }

    const winningBids = await BidService.getWinning({ 
        forEventId: event.id, 
        forBidderId: bidder.id,
        withItem: true
    });

    return {
        success: true,
        bidderId: bidder.id,
        event: event,
        categories: await CategoryService.getAll(),
        winningBids: winningBids.map(BidService.toDtoWithItem)
    };
};

export const meta: MetaFunction<typeof loader> = function ({ data }) {
    return [{ title: `${APP_NAME}: Event winnings` }];
};

export default function EventWinnings() {
    const result = useLoaderData<typeof loader>();
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
