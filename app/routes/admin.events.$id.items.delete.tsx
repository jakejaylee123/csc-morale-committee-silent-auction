import { json, type ActionFunction, type ActionFunctionArgs, type SerializeFrom } from "@remix-run/node";

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
export type SerializedEventItemDeleteResult = SerializeFrom<EventItemDeleteResult>;

export const action = async function ({ request, params }: ActionFunctionArgs) {
    await requireAuthenticatedBidder(request, {
        mustBeAdmin: true
    });

    const { id } = params;
    if (!Identifiers.isIntegerId(id)) {
        return json({
            success: false,
            errors: [`The passed event ID "${id}" was not valid`]
        } satisfies EventItemDeleteResult);
    }

    const formData = await request.formData();
    console.log(formData);
    const itemId = formData.get("id") as string;
    if (!Identifiers.isIntegerId(itemId)) {
        return json({
            success: false,
            errors: [`The passed item ID "${itemId}" was not valid`]
        } satisfies EventItemDeleteResult);
    }

    try {
        const itemIdInt = parseInt(itemId);
        await ItemService.delete(itemIdInt);

        return json({ 
            success: true,
            deletedItemId: itemIdInt
        } satisfies EventItemDeleteResult);
    } catch (error) {
        console.log({ error });
        return json({
            success: false,
            errors: [(error as Error).message || "An unknown error occurred."]
        } satisfies EventItemDeleteResult);
    }
} satisfies ActionFunction;