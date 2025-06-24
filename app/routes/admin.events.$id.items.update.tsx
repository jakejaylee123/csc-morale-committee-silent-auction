import { type ActionFunctionArgs } from "react-router";

import { requireAuthenticatedBidder } from "~/services/auth.server";

import { ItemCreate, ItemService, ItemUpdate } from "~/services/item.server";
import { Dto, Identifiers } from "~/commons/general.common";
import { Item } from "@prisma/client";

export type ItemUpdateResult = {
    operation: "create" | "update"
    item: Dto<Item>
};

export type EventItemUpdateResult = {
    success: true
    results: ItemUpdateResult[]
} | {
    success: false,
    errors: { index: number | string, messages: string[] }[];
};

export async function action({ request, params }: ActionFunctionArgs): Promise<EventItemUpdateResult> {
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
    console.log("Form data for updating event item: ", formData);

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
    
    console.log("Bulk change request creation result: ", requestResult);
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
        const updateResults: ItemUpdateResult[] = updatedItems
            .map(item => ({ 
                operation: "update", 
                item: ItemService.toDto(item)
            }));

        const createRequests = requestResult.requests
            .filter(request => !Object.hasOwn(request, "id"));
        const createdItems = createRequests.length 
            ? await ItemService.createBulk(createRequests as ItemCreate[])
            : [];
        const createResults: ItemUpdateResult[] = createdItems
            .map(item => ({ 
                operation: "create", 
                item: ItemService.toDto(item)
            }));

        return { 
            success: true,
            results: [...updateResults, ...createResults]
        };
    } catch (error) {
        console.log("Error bulk-updating items: ", error);
        return {
            success: false,
            errors: [{
                index: "N/A",
                messages: [JSON.stringify(error)]
            }]
        };
    }
};