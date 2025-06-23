import type { LoaderFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json, MetaFunction, useLoaderData } from "@remix-run/react";

import { requireAuthenticatedBidder } from "~/services/auth.server";
import { EventService, EventWithItems } from "~/services/event.server";
import { APP_NAME, Dto, Identifiers } from "~/commons/general.common";
import { GleamingHeader } from "~/components/GleamingHeader";
import { CategoryCode, Event, Item } from "@prisma/client";
import { CategoryService } from "~/services/category.server";
import { BidService, BidWithItemAndBidder } from "~/services/bid.server";
import { WinnerReport } from "~/components/WinnerReport";
import { ItemService } from "~/services/item.server";

type AdminEventReportWinnersLoaderFunctionData = Dto<{
    success: true,
    event: EventWithItems,
    categories: CategoryCode[],
    winningBids: BidWithItemAndBidder[],
    disqualifiedItems: Item[]
} | {
    success: false,
    error: string
}>;

export const loader = async function ({ request, params }: LoaderFunctionArgs): Promise<AdminEventReportWinnersLoaderFunctionData> {
    await requireAuthenticatedBidder(request, {
        mustBeAdmin: true
    });
    
    const { id } = params;
    const event = Identifiers.isIntegerId(id)
        ? await EventService.get(parseInt(id), { withDisqualifiedItems: true })
        : null;

    if (!event) {
        return {
            success: false,
            error: `Event "${id}" was not found.`
        };
    }

    const winningBids = await BidService.getWinning({ 
        forEventId: event.id,
        withItem: true,
        withBidder: true
    });

    return {
        success: true,
        event: EventService.toDtoWithItems(event),
        disqualifiedItems: event.items.map(ItemService.toDto),
        categories: await CategoryService.getAll(),
        winningBids: winningBids.map(BidService.toDtoWithItemAndBidder)
    };
};

export const meta: MetaFunction<typeof loader> = function ({ data }) {
    return [{ title: `${APP_NAME}: Event winners report` }];
};

export default function AdminEventReportWinners() {
    const result = useLoaderData<typeof loader>();
    console.log(result);
    if (!result?.success) {
        return (
            <>
                <GleamingHeader
                    title="Unable to view bid sheet"
                    description={result.error}
                />
            </>
        );
    }
    
    const { 
        event,
        categories,
        winningBids,
        disqualifiedItems
    } = result;
    return (
        <>
            <GleamingHeader />
            <WinnerReport 
                title={`Winning Bids for Auction Event: "${event.description}"`}
                event={event}
                categories={categories}
                winningBids={winningBids}
                disqualifiedItems={disqualifiedItems}
            />
        </>
    );
}
