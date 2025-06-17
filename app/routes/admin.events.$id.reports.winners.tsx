import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { requireAuthenticatedBidder } from "~/services/auth.server";
import { EventService } from "~/services/event.server";
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
type SerializedAdminEventReportWinnersLoaderFunctionData = ReturnType<typeof useLoaderData<typeof loader>>;

export async function loader({ request, params }: LoaderFunctionArgs): Promise<AdminEventReportWinnersLoaderFunctionData> {
    await requireAuthenticatedBidder(request, {
        mustBeAdmin: true
    });
    
    const { id } = params;
    const event = Identifiers.isIntegerId(id)
        ? await EventService.get(parseInt(id), { withDisqualifiedItems: true })
        : null;

    if (!event) return {
        success: false,
        error: `Event "${id}" was not found.`
    };

    const winningBids = await BidService.getWinning({ 
        forEventId: event.id,
        withItem: true,
        withBidder: true
    });

    return {
        success: true,
        event: event,
        disqualifiedItems: event.items,
        categories: await CategoryService.getAll(),
        winningBids
    };
};

export function meta() {
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
