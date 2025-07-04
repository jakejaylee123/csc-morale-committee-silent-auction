import type { LoaderFunctionArgs, MetaDescriptor } from "react-router";
import { useLoaderData } from "react-router";

import Fab from "@mui/material/Fab"; 

import Print from "@mui/icons-material/Print";

import { requireAuthenticatedBidder } from "~/services/auth.server";
import { EventService, EventWithItems } from "~/services/event.server";
import { APP_NAME, Dto, Identifiers } from "~/commons/general.common";
import { GleamingHeader } from "~/components/GleamingHeader";
import { BidSheetReport } from "~/components/BidSheetReport";
import { CategoryCode } from "@prisma/client";
import { CategoryService } from "~/services/category.server";
import { EventCommon } from "~/commons/event.common";

type EventReportBidSheetLoaderFunctionData = {
    success: true,
    event: Dto<EventWithItems>,
    categories: Dto<CategoryCode>[]
} | {
    success: false,
    error: string
};

export async function loader({ request, params }: LoaderFunctionArgs): Promise<EventReportBidSheetLoaderFunctionData> {
    const { bidder } = await requireAuthenticatedBidder(request);
    
    const { id } = params;
    const event = Identifiers.isIntegerId(id)
        ? await EventService.get(parseInt(id), { withItems: true })
        : null;

    if (!event) {
        return {
            success: false,
            error: `Event "${id}" was not found.`
        };
    } else if (!EventCommon.isEnabledAndActive(event) && !bidder.adminAssignment) {
        return {
            success: false,
            error: "Only administrators can view bid sheets for disabled/inactive  events."
        };
    } else if (!event.items.length) {
        return {
            success: false,
            error: `Event "${event.description}" does not have any items for a bid sheet report.`
        };
    }

    return {
        success: true,
        event: EventService.toDtoWithItems(event),
        categories: await CategoryService.getAll()
    };
};

export function meta(): MetaDescriptor[] {
    return [{ title: `${APP_NAME}: Bid sheet report` }];
};

export default function EventReportBidSheet() {
    const result = useLoaderData<typeof loader>();
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
