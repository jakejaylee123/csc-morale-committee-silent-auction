import type { LoaderFunction, SerializeFrom } from "@remix-run/node";
import { json, useLoaderData } from "@remix-run/react";

import { requireAuthenticatedBidder } from "~/services/auth.server";
import { EventService, EventWithItems } from "~/services/event.server";
import { Identifiers } from "~/commons/general.common";
import { GleamingHeader } from "~/components/GleamingHeader";
import { BidSheetReport } from "~/components/BidSheetReport";
import { CategoryCode } from "@prisma/client";
import { CategoryService } from "~/services/category.server";

type EventReportBidSheetLoaderFunctionData = {
    success: true,
    event: EventWithItems,
    categories: CategoryCode[]
} | {
    success: false,
    error: string
};
type SerializedEventReportBidSheetLoaderFunctionData 
    = SerializeFrom<EventReportBidSheetLoaderFunctionData>;

export const loader = async function ({ request, params }) {
    const { bidder } = await requireAuthenticatedBidder(request);
    
    const { id } = params;
    const event = await (async () => {
        if (Identifiers.isIntegerId(id)) {
            return await EventService
                .get(parseInt(id), { withItems: true }) as EventWithItems;
        } else {
            return null;
        }
    })() satisfies EventWithItems | null;

    if (!event) {
        return json({
            success: false,
            error: `Event "${id}" was not found.`
        } satisfies EventReportBidSheetLoaderFunctionData);
    } else if (!EventService.isEnabledAndActive(event) && !bidder.adminAssignment) {
        return json({
            success: false,
            error: "Only administrators can view bid sheets for disabled/inactive auction events."
        } satisfies EventReportBidSheetLoaderFunctionData);
    } else if (!event.items.length) {
        return json({
            success: false,
            error: `Event "${id}" does not have any items for a bid sheet report.`
        } satisfies EventReportBidSheetLoaderFunctionData);
    }

    return json({
        success: true,
        event,
        categories: await CategoryService.getAll()
    } satisfies EventReportBidSheetLoaderFunctionData);
} satisfies LoaderFunction;

export default function EventReportBidSheet() {
    const result = useLoaderData<typeof loader>() satisfies SerializedEventReportBidSheetLoaderFunctionData;
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
            <BidSheetReport
                title={`Bid Sheet for Auction Event: "${event.description}"`}
                event={event}
                categories={categories}
            />
        </>
    );
}
