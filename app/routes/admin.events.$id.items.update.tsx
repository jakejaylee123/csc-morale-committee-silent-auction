import { type ActionFunctionArgs } from "react-router";

import { requireAuthenticatedBidder } from "~/services/auth.server";

import { ItemCreate, ItemService, ItemUpdate, NewOrExistingItem } from "~/services/item.server";
import { BasicDto, Dto, Identifiers } from "~/commons/general.common";
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

    const itemRequest = await request.json() as BasicDto<NewOrExistingItem>;
    console.log("Request for updating/creating event item: ", itemRequest);

    if (!Identifiers.isIntegerId(itemRequest.id) && !Identifiers.isNew(itemRequest.id)) {
        return {
            success: false,
            errors: [{
                index: "N/A",
                messages: [`The passed item ID "${itemRequest.id}" was not valid`]
            }]
        };
    }
    
    const requestResult = await ItemService.createBulkChangeRequest({
        ...(Identifiers.isIntegerId(itemRequest.id) && { id: itemRequest.id }),
        bidderId: bidder.id,
        itemRequests: [itemRequest]
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