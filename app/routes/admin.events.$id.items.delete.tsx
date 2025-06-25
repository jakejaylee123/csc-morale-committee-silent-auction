import { type ActionFunctionArgs } from "react-router";

import { requireAuthenticatedBidder } from "~/services/auth.server";

import { ItemService, ItemWithJustId } from "~/services/item.server";
import { BasicDto, Identifiers } from "~/commons/general.common";

export type EventItemDeleteResult = {
    success: true,
    deletedItemId: number
} | {
    success: false,
    errors: string[]
};

export async function action({ request, params }: ActionFunctionArgs): Promise<EventItemDeleteResult> {
    await requireAuthenticatedBidder(request, {
        mustBeAdmin: true
    });

    const { id } = params;
    if (!Identifiers.isIntegerId(id)) {
        return {
            success: false,
            errors: [`The passed event ID "${id}" was not valid`]
        };
    }

    const itemDeleteRequest = await request.json() as BasicDto<ItemWithJustId>;
    console.log("Form data form event item deletion: ", itemDeleteRequest);

    if (!Identifiers.isIntegerId(itemDeleteRequest.id)) {
        return {
            success: false,
            errors: [`The passed item ID "${itemDeleteRequest.id}" was not valid`]
        };
    }

    try {
        await ItemService.delete(itemDeleteRequest.id);

        return { 
            success: true,
            deletedItemId: itemDeleteRequest.id
        };
    } catch (error) {
        console.log("Error deleting event item: ", error);
        
        return {
            success: false,
            errors: [JSON.stringify(error)]
        };
    }
};