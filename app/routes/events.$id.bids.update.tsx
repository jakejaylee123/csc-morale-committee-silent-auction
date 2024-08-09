import * as React from "react";

import { json, type ActionFunction, type ActionFunctionArgs, type SerializeFrom } from "@remix-run/node";

import { requireAuthenticatedBidder } from "../services/auth.server";

import { Identifiers } from "../services/common.server";
import { Bid } from "@prisma/client";
import { BidService } from "~/services/bid.server";

export type BidUpdateResult = {
    success: true,
    bid: Bid
} | {
    success: false,
    error: string;
};
export type SerializedBidUpdateResult = SerializeFrom<BidUpdateResult>;

export const action = async function ({ request, params }: ActionFunctionArgs) {
    const { bidder } = await requireAuthenticatedBidder(request);

    const { id } = params;
    if (!Identifiers.isIntegerId(id)) {
        return json({
            success: false,
            error: `The passed event ID "${id}" was not valid`
        } satisfies BidUpdateResult);
    }

    const formData = await request.formData();
    console.log(formData);

    const itemId = formData.get("itemId") as string;
    if (!Identifiers.isIntegerId(itemId)) {
        return json({
            success: false,
            error: `The passed item ID "${itemId}" was not valid`
        } satisfies BidUpdateResult);
    }
    
    const bidAmount = formData.get("bidAmount") as string;
    const parsedBidAmount = parseFloat(bidAmount);
    if (isNaN(parsedBidAmount)) {
        return json({
            success: false,
            error: `The passed bid amount "${bidAmount}" was not valid`
        } satisfies BidUpdateResult);
    }
    
    const parsedEventId = parseInt(id);
    const parsedItemId = parseInt(itemId);
    const currentBid = await BidService.get({
        eventId: parsedEventId,
        bidderId: bidder.id,
        itemId: parsedItemId
    });
    if (currentBid) {
        return json({
            success: false,
            error: `There is already a confirmed bid of ${currentBid.bidAmount} for this item`
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
            error: (error as Error).message || "An unknown error occurred."
        } satisfies BidUpdateResult);
    }
} satisfies ActionFunction;