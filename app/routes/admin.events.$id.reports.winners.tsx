import type { LoaderFunction, SerializeFrom } from "@remix-run/node";
import { json, MetaFunction, useLoaderData } from "@remix-run/react";

import { requireAuthenticatedBidder } from "~/services/auth.server";
import { EventService, EventWithItems } from "~/services/event.server";
import { APP_NAME, Identifiers } from "~/commons/general.common";
import { GleamingHeader } from "~/components/GleamingHeader";
import { CategoryCode, Event, Item } from "@prisma/client";
import { CategoryService } from "~/services/category.server";
import { BidService, BidWithItemAndBidder } from "~/services/bid.server";
import { WinnerReport } from "~/components/WinnerReport";

type AdminEventReportWinnersLoaderFunctionData = {
    success: true,
    event: Event,
    categories: CategoryCode[],
    winningBids: BidWithItemAndBidder[],
    disqualifiedItems: Item[]
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
    const event = Identifiers.isIntegerId(id)
        ? await EventService.get(parseInt(id), { withDisqualifiedItems: true })
        : null;

    if (!event) {
        return json({
            success: false,
            error: `Event "${id}" was not found.`
        } satisfies AdminEventReportWinnersLoaderFunctionData);
    }

    const winningBids = await BidService.getWinning({ 
        forEventId: event.id,
        withItem: true,
        withBidder: true
    });

    return json({
        success: true,
        event: event,
        disqualifiedItems: event.items,
        categories: await CategoryService.getAll(),
        winningBids
    } satisfies AdminEventReportWinnersLoaderFunctionData);
} satisfies LoaderFunction;

export const meta: MetaFunction<typeof loader> = function ({ data }) {
    return [{ title: `${APP_NAME}: Event winners report` }];
};

export default function AdminEventReportWinners() {
    const result = useLoaderData<typeof loader>() satisfies SerializedAdminEventReportWinnersLoaderFunctionData;
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
