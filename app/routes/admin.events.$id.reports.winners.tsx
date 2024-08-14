import type { LoaderFunction, SerializeFrom } from "@remix-run/node";
import { json, MetaFunction, useLoaderData } from "@remix-run/react";

import { requireAuthenticatedBidder } from "~/services/auth.server";
import { EventService, EventWithConvenience, EventWithItems } from "~/services/event.server";
import { APP_NAME, Identifiers } from "~/commons/general.common";
import { GleamingHeader } from "~/components/GleamingHeader";
import { CategoryCode, Event } from "@prisma/client";
import { CategoryService } from "~/services/category.server";
import { BidService, BidWithItemAndBidder } from "~/services/bid.server";
import { WinnerReport } from "~/components/WinnerReport";

type AdminEventReportWinnersLoaderFunctionData = {
    success: true,
    event: EventWithConvenience,
    categories: CategoryCode[],
    winningBids: BidWithItemAndBidder[]
} | {
    success: false,
    error: string
};
type SerializedAdminEventReportWinnersLoaderFunctionData
    = SerializeFrom<AdminEventReportWinnersLoaderFunctionData>;

export const loader = async function ({ request, params }) {
    await requireAuthenticatedBidder(request, {
        mustBeAdmin: true
    });
    
    const { id } = params;
    const event = await (async () => {
        if (Identifiers.isIntegerId(id)) {
            return await EventService.get(parseInt(id));
        } else {
            return null;
        }
    })() satisfies Event | null;

    if (!event) {
        return json({
            success: false,
            error: `Event "${id}" was not found.`
        } satisfies AdminEventReportWinnersLoaderFunctionData);
    }

    const winningBids = await BidService.getWinning({ 
        eventId: event.id,
        withItem: true,
        withBidder: true
    });

    return json({
        success: true,
        event: event,
        categories: await CategoryService.getAll(),
        winningBids: winningBids.filter(bid => BidService.isBidWithItemAndBidder(bid))
    } satisfies AdminEventReportWinnersLoaderFunctionData);
} satisfies LoaderFunction;

export const meta: MetaFunction<typeof loader> = function ({ data }) {
    return [{ title: `${APP_NAME}: Event winners report` }];
};

export default function AdminEventReportWinners() {
    const result = useLoaderData<typeof loader>() satisfies SerializedAdminEventReportWinnersLoaderFunctionData;
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
    
    const { event } = result;
    return (
        <>
            <GleamingHeader />
            <WinnerReport 
                title={`Winning Bids for Auction Event: "${event.description}"`}
                {...result} 
            />
        </>
    );
}
