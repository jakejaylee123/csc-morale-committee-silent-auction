import type { ActionFunction, ActionFunctionArgs, SerializeFrom } from "@remix-run/node";
import { json } from "@remix-run/react";

import { requireAuthenticatedBidder } from "~/services/auth.server";
import { Identifiers } from "~/commons/general.common";
import { Bid } from "@prisma/client";
import { BidService } from "~/services/bid.server";

type AdminEventBidDisqualifyResult = {
    success: true,
    bid: Bid
} | {
    success: false,
    error: string
};
export type SerializedAdminEventBidDisqualifyResult = SerializeFrom<AdminEventBidDisqualifyResult>;

export const action = async function ({ request, params }: ActionFunctionArgs) {
    const { bidder } = await requireAuthenticatedBidder(request, {
        mustBeAdmin: true
    });

    const { id } = params;
    if (!Identifiers.isIntegerId(id)) {
        return json({
            success: false,
            error: `The passed event ID "${id}" was not valid.`
        } satisfies AdminEventBidDisqualifyResult);
    }

    const formData = await request.formData();
    const bidId = formData.get("bidId") as string;
    if (!Identifiers.isIntegerId(bidId)) {
        return json({
            success: false,
            error: `The passed bid ID "${bidId}" was not valid.`
        } satisfies AdminEventBidDisqualifyResult);
    }

    const parsedBidId = parseInt(bidId);
    const currentBid = await BidService.get({ 
        forBidId: parsedBidId
    });
    if (!currentBid) {
        return json({
            success: false,
            error: `The bid referenced by ID "${bidId}" was not found.`
        } satisfies AdminEventBidDisqualifyResult);
    }

    try {
        return json({ 
            success: true,
            bid: await BidService.disqualify(bidder.id, {
                forBidId: parsedBidId
            })
        } satisfies AdminEventBidDisqualifyResult);
    } catch (error) {
        console.log("Error trying to disqualify bid: ", error);
        return json({
            success: false,
            error: JSON.stringify(error)
        } satisfies AdminEventBidDisqualifyResult);
    }
} satisfies ActionFunction;
