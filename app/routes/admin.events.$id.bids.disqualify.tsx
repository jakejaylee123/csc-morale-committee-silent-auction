import type { ActionFunctionArgs } from "react-router";

import { requireAuthenticatedBidder } from "~/services/auth.server";
import { BasicDto, Dto, Identifiers } from "~/commons/general.common";
import { Bid } from "@prisma/client";
import { BidService, BidWithJustId } from "~/services/bid.server";

export type AdminEventBidDisqualifyResult = {
    success: true,
    bid: Dto<Bid>
} | {
    success: false,
    error: string
};

export async function action({ request, params }: ActionFunctionArgs): Promise<AdminEventBidDisqualifyResult> {
    const { bidder } = await requireAuthenticatedBidder(request, {
        mustBeAdmin: true
    });

    const { id } = params;
    if (!Identifiers.isIntegerId(id)) {
        return {
            success: false,
            error: `The passed event ID "${id}" was not valid.`
        };
    }

    const bidToDisqualify = await request.json() as BasicDto<BidWithJustId>;
    const bidId = bidToDisqualify.id;
    if (!Identifiers.isIntegerId(bidId)) {
        return {
            success: false,
            error: `The passed bid ID "${bidId}" was not valid.`
        };
    }

    const currentBid = await BidService.getById(bidId);
    if (!currentBid) {
        return {
            success: false,
            error: `The bid referenced by ID "${bidId}" was not found.`
        };
    }

    const disqualifiedBid = await BidService.disqualify(bidId, bidder.id);
    try {
        return { 
            success: true,
            bid: BidService.toDto(disqualifiedBid)
        };
    } catch (error) {
        console.log("Error trying to disqualify bid: ", error);
        return {
            success: false,
            error: JSON.stringify(error)
        };
    }
};
