import type { LoaderFunction, SerializeFrom } from "@remix-run/node";
import { json, MetaFunction, useLoaderData } from "@remix-run/react";

import Fab from "@mui/material/Fab"; 

import Print from "@mui/icons-material/Print";

import { requireAuthenticatedBidder } from "~/services/auth.server";
import { EventService, EventWithItems } from "~/services/event.server";
import { APP_NAME, Identifiers } from "~/commons/general.common";
import { GleamingHeader } from "~/components/GleamingHeader";
import { BidSheetReport } from "~/components/BidSheetReport";
import { CategoryCode } from "@prisma/client";
import { CategoryService } from "~/services/category.server";
import { EventCommon } from "~/commons/event.common";

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
    const event = Identifiers.isIntegerId(id)
        ? await EventService.get(parseInt(id), { withItems: true })
        : null;

    if (!event) {
        return json({
            success: false,
            error: `Event "${id}" was not found.`
        } satisfies EventReportBidSheetLoaderFunctionData);
    } else if (!EventCommon.isEnabledAndActive(event) && !bidder.adminAssignment) {
        return json({
            success: false,
            error: "Only administrators can view bid sheets for disabled/inactive  events."
        } satisfies EventReportBidSheetLoaderFunctionData);
    } else if (!event.items.length) {
        return json({
            success: false,
            error: `Event "${event.description}" does not have any items for a bid sheet report.`
        } satisfies EventReportBidSheetLoaderFunctionData);
    }

    return json({
        success: true,
        event,
        categories: await CategoryService.getAll()
    } satisfies EventReportBidSheetLoaderFunctionData);
} satisfies LoaderFunction;

export const meta: MetaFunction<typeof loader> = function ({ data }) {
    return [{ title: `${APP_NAME}: Bid sheet report` }];
};

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
            <Fab 
                variant="extended"
                size="large"
                color="primary"
                onClick={() => window.print()}
                sx={{ 
                    position: "fixed", 
                    bottom: 75, 
                    right: 25,
                    displayPrint: "none"
                }}
            >
                <Print sx={{ mr: 1 }} />
                Print
            </Fab>
        </>
    );
}
