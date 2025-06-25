import { type ActionFunctionArgs } from "react-router";

import { requireAuthenticatedBidder } from "~/services/auth.server";

import { BasicDto, Dto, Identifiers } from "~/commons/general.common";
import { Bid } from "@prisma/client";
import { BidService, NewBid } from "~/services/bid.server";
import { EventService } from "~/services/event.server";
import { EventCommon } from "~/commons/event.common";
import { ItemService } from "~/services/item.server";

export type BidUpdateResult = {
    success: true,
    bid: Dto<Bid>
} | {
    success: false,
    concluded: boolean,
    error: string;
};

export async function action({ request, params }: ActionFunctionArgs): Promise<BidUpdateResult> {
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

    const bidUpdateRequest = await request.json() as BasicDto<NewBid>;
    console.log("Form data for updating bid: ", bidUpdateRequest);

    const {
        itemId,
        bidAmount
    } = bidUpdateRequest;

    if (!Identifiers.isIntegerId(itemId)) {
        return {
            success: false,
            concluded: false,
            error: `The passed item ID "${itemId}" was not valid.`
        };
    }

    const item = await ItemService.get(itemId);
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
    
    if (isNaN(bidAmount) || bidAmount <= 0) {
        return {
            success: false,
            concluded: false,
            error: `The passed bid amount "$${bidAmount || "0.00"}" was not valid.`
        };
    }

    if (item.minimumBid && item.minimumBid.greaterThan(bidAmount)) {
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
        forItemId: itemId
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
            itemId: itemId,
            bidAmount: bidAmount
        });

        return { 
            success: true,
            bid: BidService.toDto(newBid)
        };
    } catch (error) {
        console.log("Error updating bid: ", error);

        return {
            success: false,
            concluded: false,
            error: JSON.stringify(error)
        };
    }
};