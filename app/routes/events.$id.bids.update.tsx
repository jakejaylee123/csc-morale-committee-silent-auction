import { type ActionFunctionArgs } from "@remix-run/node";

import { requireAuthenticatedBidder } from "~/services/auth.server";

import { Dto, Identifiers } from "~/commons/general.common";
import { Bid } from "@prisma/client";
import { BidService } from "~/services/bid.server";
import { EventService } from "~/services/event.server";
import { EventCommon } from "~/commons/event.common";
import { ItemService } from "~/services/item.server";

export type BidUpdateResult = Dto<{
    success: true,
    bid: Bid
} | {
    success: false,
    concluded: boolean,
    error: string;
}>;

export const action = async function ({ request, params }: ActionFunctionArgs): Promise<BidUpdateResult> {
    const { bidder } = await requireAuthenticatedBidder(request);

    const { id } = params;
    if (!Identifiers.isIntegerId(id)) {
        return {
            success: false,
            concluded: false,
            error: `The passed event ID "${id}" was not valid.`
        };
    }

    const parsedEventId = parseInt(id);
    const event = await EventService.get(parsedEventId);
    if (!event) {
        return {
            success: false,
            concluded: false,
            error: `Event "${id}" was not found.`
        };
    } else if (!EventCommon.isEnabledAndActive(event)) {
        return {
            success: false,
            concluded: true,
            error: `Event "${event.description}" is not active/enabled.`
        };
    }

    const formData = await request.formData();
    console.log(formData);

    const itemId = formData.get("itemId") as string;
    if (!Identifiers.isIntegerId(itemId)) {
        return {
            success: false,
            concluded: false,
            error: `The passed item ID "${itemId}" was not valid.`
        };
    }

    const parsedItemId = parseInt(itemId);
    const item = await ItemService.get(parsedItemId);
    if (!item) {
        return {
            success: false,
            concluded: false,
            error: `Item "${itemId}" was not found.`
        };
    } else if (item.disqualified) {
        return {
            success: false,
            concluded: true,
            error: "This item has been disqualified." + item.disqualificationReason 
                ? ` Reason: ${item.disqualificationReason}`
                : ""
        };
    }
    
    const bidAmount = formData.get("bidAmount") as string;
    const parsedBidAmount = parseFloat(bidAmount);
    if (isNaN(parsedBidAmount) || parsedBidAmount <= 0) {
        return {
            success: false,
            concluded: false,
            error: `The passed bid amount "$${bidAmount || "0.00"}" was not valid.`
        };
    }

    if (item.minimumBid && item.minimumBid.greaterThan(parsedBidAmount)) {
        return {
            success: false,
            concluded: false,
            error: `The passed bid amount "${bidAmount || "$0.00"}" was not `
             + `greater than or equal to the item's minimum bid amount "$${item.minimumBid || "0.00"}"`
        };
    }
    
    const currentBid = await BidService.get({
        forEventId: parsedEventId,
        forBidderId: bidder.id,
        forItemId: parsedItemId
    });
    if (currentBid) {
        return {
            success: false,
            concluded: false,
            error: `There is already a confirmed bid of ${currentBid.bidAmount} for this item.`
        };
    }

    try {
        const newBid = await BidService.create({
            eventId: parsedEventId,
            bidderId: bidder.id,
            itemId: parsedItemId,
            bidAmount: parsedBidAmount
        });

        return { 
            success: true,
            bid: BidService.toDto(newBid)
        };
    } catch (error) {
        console.log({ error });
        return {
            success: false,
            concluded: false,
            error: JSON.stringify(error)
        };
    }
};