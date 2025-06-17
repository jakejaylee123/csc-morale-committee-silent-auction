import type { ActionFunctionArgs } from "@remix-run/node";

import { requireAuthenticatedBidder } from "~/services/auth.server";
import { Identifiers, SerializeFrom } from "~/commons/general.common";
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

export async function action({ request, params }: ActionFunctionArgs): Promise<AdminEventBidDisqualifyResult> {
    const { bidder } = await requireAuthenticatedBidder(request, {
        mustBeAdmin: true
    });

    const { id } = params;
    if (!Identifiers.isIntegerId(id)) return {
        success: false,
        error: `The passed event ID "${id}" was not valid.`
    };

    const formData = await request.formData();
    const bidId = formData.get("bidId") as string;
    if (!Identifiers.isIntegerId(bidId)) return {
        success: false,
        error: `The passed bid ID "${bidId}" was not valid.`
    };

    const parsedBidId = parseInt(bidId);
    const currentBid = await BidService.get({ 
        forBidId: parsedBidId
    });
    if (!currentBid) return {
        success: false,
        error: `The bid referenced by ID "${bidId}" was not found.`
    };

    try {
        return { 
            success: true,
            bid: await BidService.disqualify(bidder.id, {
                forBidId: parsedBidId
            })
        };
    } catch (error) {
        console.log("Error trying to disqualify bid: ", error);

        return {
            success: false,
            error: JSON.stringify(error)
        };
    }
};
