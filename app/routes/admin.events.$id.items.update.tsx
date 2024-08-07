import * as React from "react";

import { json, type ActionFunction, type ActionFunctionArgs, type SerializeFrom } from "@remix-run/node";

import { requireAuthenticatedBidder } from "../services/auth.server";

import { ItemCreate, ItemService, ItemUpdate } from "../services/item.server";
import { Identifiers } from "../services/common.server";
import { Item } from "@prisma/client";

export type EventItemUpdateResult = {
    success: true
    items: Item[]
} | {
    success: false,
    errors: { index: number | string, messages: string[] }[];
};
export type SerializedEventItemUpdateResult = SerializeFrom<EventItemUpdateResult>;

export const action = async function ({ request, params }: ActionFunctionArgs) {
    const { bidder } = await requireAuthenticatedBidder(request, {
        mustBeAdmin: true
    });

    const { id } = params;
    if (!Identifiers.isIntegerId(id)) {
        return json({
            success: false,
            errors: [{
                index: "N/A",
                messages: [`The passed event ID "${id}" was not valid`]
            }]
        } satisfies EventItemUpdateResult);
    }

    const formData = await request.formData();
    console.log(formData);
    const itemId = formData.get("id") as string;
    if (!Identifiers.isIntegerId(itemId) && !Identifiers.isNew(itemId)) {
        return json({
            success: false,
            errors: [{
                index: "N/A",
                messages: [`The passed item ID "${itemId}" was not valid`]
            }]
        } satisfies EventItemUpdateResult);
    }

    const itemRowArray = [
        formData.get("categoryId") as string,
        formData.get("itemNumber") as string,
        formData.get("itemDescription") as string,
        formData.get("minimumBid") as string,
        formData.get("disqualified") as string,
        formData.get("disqualificationReason") as string
    ];
    console.log("Item row array: ", itemRowArray);
    
    const requestResult = await ItemService.createBulkChangeRequest({
        ...(Identifiers.isIntegerId(itemId) && { id: parseInt(itemId) }),
        categoryCodeIsId: true,
        bidderId: bidder.id,
        eventId: parseInt(id),
        itemRowArrays: [itemRowArray]
    });
    console.log(requestResult);
    if (!requestResult.success) {
        return json({
            success: false,
            errors: Object
                .keys(requestResult.errors)
                .map(key => ({
                    index: key,
                    messages: requestResult.errors[key]
                }))
        } satisfies EventItemUpdateResult);
    }

    try {
        const updateRequests = requestResult.requests
            .filter(request => Object.hasOwn(request, "id"));
        const updatedItems = updateRequests.length
            ? await ItemService.updateBulk(updateRequests as ItemUpdate[])
            : [];

        const createRequests = requestResult.requests
            .filter(request => !Object.hasOwn(request, "id"));
        const createdItems = createRequests.length 
            ? await ItemService.createBulk(createRequests as ItemCreate[])
            : [];

        return json({ 
            success: true,
            items: updatedItems.concat(createdItems)
        } satisfies EventItemUpdateResult);
    } catch (error) {
        console.log({ error });
        return json({
            success: false,
            errors: [{
                index: "N/A",
                messages: [(error as any).message || "An unknown error occurred."]
            }]
        } satisfies EventItemUpdateResult);
    }
} satisfies ActionFunction;