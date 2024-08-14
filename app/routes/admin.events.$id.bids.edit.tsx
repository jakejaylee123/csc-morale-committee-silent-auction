import type { LoaderFunction, SerializeFrom } from "@remix-run/node";
import { json, MetaFunction, useLoaderData } from "@remix-run/react";

import { requireAuthenticatedBidder } from "~/services/auth.server";
import { EventService, EventWithConvenience, EventWithItems } from "~/services/event.server";
import { APP_NAME, Identifiers } from "~/commons/general.common";
import { GleamingHeader } from "~/components/GleamingHeader";
import { CategoryService } from "~/services/category.server";
import { Bid, CategoryCode } from "@prisma/client";
import { BidService, BidWithItem, BidWithItemAndBidder } from "~/services/bid.server";
import { BidEditor } from "~/components/BidEditor";
import { EventCommon } from "~/commons/event.common";
import { AdminBidEditor } from "~/components/AdminBidEditor";

type AdminEventBidLoaderFunctionData = {
    success: true,
    event: EventWithConvenience,
    categories: CategoryCode[],
    bids: BidWithItemAndBidder[]
} | {
    success: false,
    error: string
};
type SerializedAdminEventBidLoaderFunctionData = SerializeFrom<AdminEventBidLoaderFunctionData>;

export const loader = async function ({ request, params }) {
    const { bidder } = await requireAuthenticatedBidder(request, {
        mustBeAdmin: true
    });
    
    const { id } = params;
    const event = await (async () => {
        if (Identifiers.isIntegerId(id)) {
            return await EventService
                .get(parseInt(id), { withItems: true }) as EventWithConvenience;
        } else {
            return null;
        }
    })() satisfies EventWithConvenience | null;

    if (!event) {
        return json({
            success: false,
            error: `Event "${id}" was not found.`
        } satisfies AdminEventBidLoaderFunctionData);
    }

    return json({
        success: true,
        event: event as EventWithItems,
        categories: await CategoryService.getAll(),
        bids: await BidService.getMany({ 
            eventId: event.id, 
            bidderId: 
            bidder.id,
            withBidder: true,
            withItem: true
        }) as BidWithItemAndBidder[]
    } satisfies AdminEventBidLoaderFunctionData);
} satisfies LoaderFunction;

export const meta: MetaFunction<typeof loader> = function ({ data }) {
    return [{ title: `${APP_NAME}: Manage bids` }];
};

export default function AdminEventBidsEdit() {
    const result = useLoaderData<typeof loader>() satisfies SerializedAdminEventBidLoaderFunctionData;
    if (!result?.success) {
        return (
            <>
                <GleamingHeader
                    title="Unable to bid on this auction"
                    description={result.error}
                />
            </>
        );
    }

    const { event, categories, bids } = result;
    return (
        <>
            <GleamingHeader
                title={event.description}
                titleVariant="h4"
                description=""
            />
            <AdminBidEditor
                event={event}
                categories={categories}
                bids={bids} />
        </>
    );
}
