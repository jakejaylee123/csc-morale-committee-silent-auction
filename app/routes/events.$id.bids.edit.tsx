import type { LoaderFunction, SerializeFrom } from "@remix-run/node";
import { json, MetaFunction, useLoaderData } from "@remix-run/react";

import { requireAuthenticatedBidder } from "~/services/auth.server";
import { EventService, EventWithItems } from "~/services/event.server";
import { APP_NAME, Identifiers } from "~/commons/general.common";
import { GleamingHeader } from "~/components/GleamingHeader";
import { CategoryService } from "~/services/category.server";
import { Bid, CategoryCode } from "@prisma/client";
import { BidService } from "~/services/bid.server";
import { BidEditor } from "~/components/BidEditor";
import { EventCommon } from "~/commons/event.common";

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
    const { bidder } = await requireAuthenticatedBidder(request);
    
    const { id } = params;
    const event = Identifiers.isIntegerId(id)
        ? await EventService.get(parseInt(id), { withQualifiedItems: true })
        : null;

    if (!event) {
        return json({
            success: false,
            error: `Event "${id}" was not found.`
        } satisfies EventBidLoaderFunctionData);
    } else if (!EventCommon.isEnabledAndActive(event)) {
        return json({
            success: false,
            error: `The event "${event.description}" is disabled/inactive.`
        } satisfies EventBidLoaderFunctionData);
    } else if (!event.items.length) {
        return json({
            success: false,
            error: `Event "${event.description}" does not have any items to bid on.`
        } satisfies EventBidLoaderFunctionData);
    }

    return json({
        success: true,
        event: event,
        categories: await CategoryService.getAll(),
        bids: await BidService.getMany({ forEventId: event.id, forBidderId: bidder.id })
    } satisfies EventBidLoaderFunctionData);
} satisfies LoaderFunction;

export const meta: MetaFunction<typeof loader> = function ({ data }) {
    return [{ title: `${APP_NAME}: Bid` }];
};

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
