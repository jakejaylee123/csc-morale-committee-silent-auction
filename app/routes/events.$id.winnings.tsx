import type { LoaderFunctionArgs } from "react-router";
import { MetaFunction, useLoaderData } from "react-router";

import { requireAuthenticatedBidder } from "~/services/auth.server";
import { EventService, EventWithConvenience } from "~/services/event.server";
import { APP_NAME, Dto, Identifiers } from "~/commons/general.common";
import { GleamingHeader } from "~/components/GleamingHeader";
import { CategoryService } from "~/services/category.server";
import { CategoryCode, Item } from "@prisma/client";
import { BidService, BidWithItem, BidWithItemAndBidder } from "~/services/bid.server";
import { Winnings } from "~/components/Winnings";
import { EventCommon } from "~/commons/event.common";
import { ItemService } from "~/services/item.server";

type EventWinningsLoaderFunctionData = {
    success: true,
    bidderId: number,
    event: Dto<EventWithConvenience>,
    categories: Dto<CategoryCode>[],
    winningBids: Dto<BidWithItemAndBidder>[],
    disqualifiedItems: Dto<Item>[]
} | {
    success: false,
    error: string
};

export async function loader({ request, params }: LoaderFunctionArgs): Promise<EventWinningsLoaderFunctionData> {
    const { bidder } = await requireAuthenticatedBidder(request);
    
    const { id } = params;

    const event = Identifiers.isIntegerId(id)
        ? await EventService.get(parseInt(id), { withDisqualifiedItems: true })
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
        withItem: true,
        withBidder: true
    });

    return {
        success: true,
        bidderId: bidder.id,
        event: EventService.toDtoWithItems(event),
        disqualifiedItems: event.items.map(ItemService.toDto),
        categories: await CategoryService.getAll(),
        winningBids: winningBids.map(BidService.toDtoWithItemAndBidder)
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
            <Winnings 
                bidderId={result.bidderId}
                event={result.event}
                title={result.event.description}
                disqualifiedItems={result.disqualifiedItems}
                categories={result.categories}
                winningBids={result.winningBids} />
        </>
    );
}
