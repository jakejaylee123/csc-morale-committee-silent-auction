import * as React from "react";

import { json, type ActionFunction, type ActionFunctionArgs, type SerializeFrom } from "@remix-run/node";

import { requireAuthenticatedBidder } from "~/services/auth.server";

import { Identifiers } from "~/commons/general.common";
import { Bid } from "@prisma/client";
import { BidService } from "~/services/bid.server";
import { EventService } from "~/services/event.server";
import { EventCommon } from "~/commons/event.common";
import { ItemService } from "~/services/item.server";

export type BidUpdateResult = {
    success: true,
    bid: Bid
} | {
    success: false,
    concluded: boolean,
    error: string;
};
export type SerializedBidUpdateResult = SerializeFrom<BidUpdateResult>;

export const action = async function ({ request, params }: ActionFunctionArgs) {
    const { bidder } = await requireAuthenticatedBidder(request);

    const { id } = params;
    if (!Identifiers.isIntegerId(id)) {
        return json({
            success: false,
            concluded: false,
            error: `The passed event ID "${id}" was not valid.`
        } satisfies BidUpdateResult);
    }

    const parsedEventId = parseInt(id);
    const event = await EventService.get(parsedEventId);
    if (!event) {
        return json({
            success: false,
            concluded: false,
            error: `Event "${id}" was not found.`
        } satisfies BidUpdateResult);
    } else if (!EventCommon.isEnabledAndActive(event)) {
        return json({
            success: false,
            concluded: true,
            error: `Event "${event.description}" is not active/enabled.`
        } satisfies BidUpdateResult);
    }

    const formData = await request.formData();
    console.log(formData);

    const itemId = formData.get("itemId") as string;
    if (!Identifiers.isIntegerId(itemId)) {
        return json({
            success: false,
            concluded: false,
            error: `The passed item ID "${itemId}" was not valid.`
        } satisfies BidUpdateResult);
    }

    const parsedItemId = parseInt(itemId);
    const item = await ItemService.get(parsedItemId);
    if (!item) {
        return json({
            success: false,
            concluded: false,
            error: `Item "${itemId}" was not found.`
        } satisfies BidUpdateResult);
    } else if (item.disqualified) {
        return json({
            success: false,
            concluded: true,
            error: "This item has been disqualified." + item.disqualificationReason 
                ? ` Reason: ${item.disqualificationReason}`
                : ""
        } satisfies BidUpdateResult);
    }
    
    const bidAmount = formData.get("bidAmount") as string;
    const parsedBidAmount = parseFloat(bidAmount);
    if (isNaN(parsedBidAmount) || parsedBidAmount <= 0) {
        return json({
            success: false,
            concluded: false,
            error: `The passed bid amount "$${bidAmount || "0.00"}" was not valid.`
        } satisfies BidUpdateResult);
    }

    if (item.minimumBid && item.minimumBid.greaterThan(parsedBidAmount)) {
        return json({
            success: false,
            concluded: false,
            error: `The passed bid amount "${bidAmount || "$0.00"}" was not `
             + `greater than or equal to the item's minimum bid amount "$${item.minimumBid || "0.00"}"`
        } satisfies BidUpdateResult);
    }
    
    const currentBid = await BidService.get({
        eventId: parsedEventId,
        bidderId: bidder.id,
        itemId: parsedItemId
    });
    if (currentBid) {
        return json({
            success: false,
            concluded: false,
            error: `There is already a confirmed bid of ${currentBid.bidAmount} for this item.`
        } satisfies BidUpdateResult);
    }

    try {
        const newBid = await BidService.create({
            eventId: parsedEventId,
            bidderId: bidder.id,
            itemId: parsedItemId,
            bidAmount: parsedBidAmount
        });

        return json({ 
            success: true,
            bid: newBid
        } satisfies BidUpdateResult);
    } catch (error) {
        console.log({ error });
        return json({
            success: false,
            concluded: false,
            error: (error as Error).message || "An unknown error occurred."
        } satisfies BidUpdateResult);
    }
} satisfies ActionFunction;