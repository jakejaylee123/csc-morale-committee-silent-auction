import type { LoaderFunction, SerializeFrom } from "@remix-run/node";
import { json, useLoaderData } from "@remix-run/react";

import { requireAuthenticatedBidder } from "~/services/auth.server";
import { EventService, EventWithItems } from "~/services/event.server";
import { Identifiers } from "~/services/common.server";
import { GleamingHeader } from "~/components/GleamingHeader";
import { CategoryService } from "~/services/category.server";
import { Bid, CategoryCode } from "@prisma/client";
import { BidService } from "~/services/bid.server";
import { BidEditor } from "~/components/BidEditor";

type EventBidLoaderFunctionData = {
    success: true,
    event: EventWithItems,
    categories: CategoryCode[],
    bids: Bid[]
} | {
    success: false,
    error: string
};
type SerializedEventBidLoaderFunctionData = SerializeFrom<EventBidLoaderFunctionData>;

export const loader = async function ({ request, params }) {
    const { bidder } = await requireAuthenticatedBidder(request, {
        mustBeAdmin: true
    });

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
        } as EventBidLoaderFunctionData);
    } else if (!EventService.isEnabledAndActive(event)) {
        return json({
            success: false,
            error: `The auction event "${event.description}" was not found.`
        } as EventBidLoaderFunctionData);
    } else if (!event.items.length) {
        return json({
            success: false,
            error: `Event "${id}" does not have any items to bid on.`
        } as EventBidLoaderFunctionData);
    }

    return json({
        success: true,
        event: event as EventWithItems,
        categories: await CategoryService.getAll(),
        bids: await BidService.getMany({ eventId: event.id, bidderId: bidder.id })
    } satisfies EventBidLoaderFunctionData);
} satisfies LoaderFunction;

export default function EventBidsEdit() {
    const result = useLoaderData<typeof loader>() satisfies SerializedEventBidLoaderFunctionData;
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
            <BidEditor
                event={event}
                categories={categories}
                bids={bids} />
        </>
    );
}
