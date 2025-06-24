import type { LoaderFunctionArgs, MetaDescriptor } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { requireAuthenticatedBidder } from "~/services/auth.server";
import { EventService, EventWithConvenience } from "~/services/event.server";
import { APP_NAME, Dto, Identifiers } from "~/commons/general.common";
import { GleamingHeader } from "~/components/GleamingHeader";
import { CategoryService } from "~/services/category.server";
import { CategoryCode } from "@prisma/client";
import { BidService, BidWithItemAndBidder } from "~/services/bid.server";
import { AdminBidEditor } from "~/components/AdminBidEditor";

type AdminEventBidLoaderFunctionData = {
    success: true,
    event: Dto<EventWithConvenience>,
    categories: Dto<CategoryCode>[],
    bids: Dto<BidWithItemAndBidder>[]
} | {
    success: false,
    error: string
};

export async function loader({ request, params }: LoaderFunctionArgs): Promise<AdminEventBidLoaderFunctionData> {
    const { bidder } = await requireAuthenticatedBidder(request, {
        mustBeAdmin: true
    });
    
    const { id } = params;
    const event = Identifiers.isIntegerId(id)
        ? await EventService.get(parseInt(id), { withItems: true })
        : null;

    if (!event) {
        return {
            success: false,
            error: `Event "${id}" was not found.`
        };
    }

    const bids = await BidService.getMany({ 
        forEventId: event.id, 
        forBidderId: 
        bidder.id,
        withBidder: true,
        withItem: true
    });

    return {
        success: true,
        event: event,
        categories: await CategoryService.getAll(),
        bids: bids.map(BidService.toDtoWithItemAndBidder)
    };
};

export function meta(): MetaDescriptor[] {
    return [{ title: `${APP_NAME}: Manage bids` }];
};

export default function AdminEventBidsEdit() {
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
            <AdminBidEditor
                event={event}
                categories={categories}
                bids={bids} />
        </>
    );
}
