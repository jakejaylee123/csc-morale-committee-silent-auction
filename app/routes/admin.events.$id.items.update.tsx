import { json, type ActionFunction, type ActionFunctionArgs } from "@remix-run/node";

import { requireAuthenticatedBidder } from "~/services/auth.server";

import { ItemCreate, ItemService, ItemUpdate } from "~/services/item.server";
import { Dto, Identifiers } from "~/commons/general.common";
import { Item } from "@prisma/client";

export type ItemUpdateResult = Dto<{
    operation: "create" | "update"
    item: Item
}>;

export type EventItemUpdateResult = Dto<{
    success: true
    results: ItemUpdateResult[]
} | {
    success: false,
    errors: { index: number | string, messages: string[] }[];
}>;

export const action = async function ({ request, params }: ActionFunctionArgs): Promise<EventItemUpdateResult> {
    const { bidder } = await requireAuthenticatedBidder(request, {
        mustBeAdmin: true
    });

    const { id } = params;
    if (!Identifiers.isIntegerId(id)) {
        return {
            success: false,
            errors: [{
                index: "N/A",
                messages: [`The passed event ID "${id}" was not valid`]
            }]
        };
    }

    const formData = await request.formData();
    console.log(formData);
    const itemId = formData.get("id") as string;
    if (!Identifiers.isIntegerId(itemId) && !Identifiers.isNew(itemId)) {
        return {
            success: false,
            errors: [{
                index: "N/A",
                messages: [`The passed item ID "${itemId}" was not valid`]
            }]
        };
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
        return {
            success: false,
            errors: Object
                .keys(requestResult.errors)
                .map(key => ({
                    index: key,
                    messages: requestResult.errors[key]
                }))
        };
    }

    try {
        const updateRequests = requestResult.requests
            .filter(request => Object.hasOwn(request, "id"));
        const updatedItems = updateRequests.length
            ? await ItemService.updateBulk(updateRequests as ItemUpdate[])
            : [];
        const updateResults = updatedItems
            .map(item => ({ 
                operation: "update", 
                item: ItemService.toDto(item)
            } satisfies ItemUpdateResult));

        const createRequests = requestResult.requests
            .filter(request => !Object.hasOwn(request, "id"));
        const createdItems = createRequests.length 
            ? await ItemService.createBulk(createRequests as ItemCreate[])
            : [];
        const createResults = createdItems
            .map(item => ({ 
                operation: "create", 
                item: ItemService.toDto(item)
            } satisfies ItemUpdateResult));

        return { 
            success: true,
            results: [...updateResults, ...createResults]
        };
    } catch (error) {
        console.log({ error });
        return {
            success: false,
            errors: [{
                index: "N/A",
                messages: [JSON.stringify(error)]
            }]
        };
    }
};