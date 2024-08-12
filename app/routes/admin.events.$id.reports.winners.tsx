import type { LoaderFunction, SerializeFrom } from "@remix-run/node";
import { json, useLoaderData } from "@remix-run/react";

import { requireAuthenticatedBidder } from "~/services/auth.server";
import { EventService, EventWithItems } from "~/services/event.server";
import { Identifiers } from "~/commons/general.common";
import { GleamingHeader } from "~/components/GleamingHeader";
import { BidSheetReport } from "~/components/BidSheetReport";
import { CategoryCode, Event } from "@prisma/client";
import { CategoryService } from "~/services/category.server";
import { BidService, BidWithItem, BidWithItemAndBidder } from "~/services/bid.server";
import { WinnerReport } from "~/components/WinnerReport";

type AdminEventReportWinnersLoaderFunctionData = {
    success: true,
    event: Event,
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
            return await EventService
                .get(parseInt(id)) as Event;
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
    
    const { event, categories } = result;
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
