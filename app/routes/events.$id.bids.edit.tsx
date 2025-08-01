import type { LoaderFunctionArgs, MetaDescriptor } from "react-router";
import { useLoaderData } from "react-router";

import { requireAuthenticatedBidder } from "~/services/auth.server";
import { EventService, EventWithItems } from "~/services/event.server";
import { APP_NAME, Dto, Identifiers } from "~/commons/general.common";
import { GleamingHeader } from "~/components/GleamingHeader";
import { CategoryService } from "~/services/category.server";
import { Bid, CategoryCode } from "@prisma/client";
import { BidService } from "~/services/bid.server";
import { BidEditor } from "~/components/BidEditor";
import { EventCommon } from "~/commons/event.common";

type EventBidLoaderFunctionData = {
    success: true,
    event: Dto<EventWithItems>,
    categories: Dto<CategoryCode>[],
    bids: Dto<Bid>[]
} | {
    success: false,
    error: string
};

export async function loader({ request, params }: LoaderFunctionArgs): Promise<EventBidLoaderFunctionData> {
    const { bidder } = await requireAuthenticatedBidder(request);
    
    const { id } = params;
    const event = Identifiers.isIntegerId(id)
        ? await EventService.get(parseInt(id), { withQualifiedItems: true })
        : null;

    if (!event) {
        return {
            success: false,
            error: `Event "${id}" was not found.`
        };
    } else if (!EventCommon.isEnabledAndActive(event)) {
        return {
            success: false,
            error: `The event "${event.description}" is disabled/inactive.`
        };
    } else if (!event.items.length) {
        return {
            success: false,
            error: `Event "${event.description}" does not have any items to bid on.`
        };
    }

    const bids = await BidService.getMany({ forEventId: event.id, forBidderId: bidder.id });
    return {
        success: true,
        event: EventService.toDtoWithItems(event),
        categories: await CategoryService.getAll(),
        bids: bids.map(BidService.toDto)
    };
};

export function meta(): MetaDescriptor[] {
    return [{ title: `${APP_NAME}: Bid` }];
};

export default function EventBidsEdit() {
    const result = useLoaderData<typeof loader>();
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
