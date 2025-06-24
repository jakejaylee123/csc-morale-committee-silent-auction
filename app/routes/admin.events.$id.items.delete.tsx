import { type ActionFunctionArgs } from "@remix-run/node";

import { requireAuthenticatedBidder } from "~/services/auth.server";

import { ItemService } from "~/services/item.server";
import { Identifiers } from "~/commons/general.common";

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

    const formData = await request.formData();
    console.log(formData);
    const itemId = formData.get("id") as string;
    if (!Identifiers.isIntegerId(itemId)) {
        return {
            success: false,
            errors: [`The passed item ID "${itemId}" was not valid`]
        };
    }

    try {
        const itemIdInt = parseInt(itemId);
        await ItemService.delete(itemIdInt);

        return { 
            success: true,
            deletedItemId: itemIdInt
        };
    } catch (error) {
        console.log({ error });
        return {
            success: false,
            errors: [JSON.stringify(error)]
        };
    }
};