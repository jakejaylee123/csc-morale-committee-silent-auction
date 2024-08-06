import { SerializeFrom } from "@remix-run/node";

import { PrismaClient, Event, Item } from "@prisma/client";
import { DateTime } from "luxon";

import { Identifiers } from "./common.server";
import { CategoryService } from "./category.server";

export interface ItemBulkCreationRequestOptions {
    bidderId: number,
    eventId: number,
    itemRowArrays: string[][]
};
export interface ItemCreation {
    bidderId: number,
    eventId: number,
    categoryId: number,
    itemNumber: number,
    description: string,
    minimumBid?: number
};
export type ItemCreationRequestsResult = {
    success: true,
    requests: ItemCreation[]
} | {
    success: false,
    errors: { [key: string]: string[] }
}

export class ItemService {
    private static readonly client = new PrismaClient();

    public static async createBulk(requests: ItemCreation[]): Promise<void> {
        const currentDate = DateTime.now().toUTC().toJSDate();

        await ItemService.client.item.createMany({
            data: requests.map(({ 
                bidderId, 
                eventId, 
                categoryId, 
                itemNumber,
                description,
                minimumBid
            }) => ({
                eventId,
                categoryId,
                itemNumber,
                itemDescription: description,
                minimumBid: minimumBid,
                createdAt: currentDate,
                createdBy: bidderId
            }))
        });
    }

    public static async createBulkCreationRequest({ 
        bidderId, 
        eventId,
        itemRowArrays
    }: ItemBulkCreationRequestOptions): Promise<ItemCreationRequestsResult> {
        const errorHash: { [key: string]: string[] } = {};
        const categories = await CategoryService.getAll();
        
        const requests = itemRowArrays.map((array, index) => {
            const errorMessages: string[] = [];
            const [categoryCode, itemNumber, description, minimumBid] = array;
            
            const associatedCategory = categories.find(category => category.prefix === categoryCode);
            if (!associatedCategory) {
                errorMessages.push(`Proposed category by the prefix of "${categoryCode}" was not found.`);
            }

            if (!Identifiers.isIntegerId(itemNumber)) {
                errorMessages.push(`Proposed identifier was not an integer.`);
            }

            if ("" === (description || "").trim()) {
                errorMessages.push(`No description was provided`);
            }

            const bidInteger = parseInt(minimumBid);
            const bidFloat = parseFloat(minimumBid);
            if ("" !== minimumBid && isNaN(bidInteger) && isNaN(bidFloat)) {
                errorMessages.push(`Minimum bid must be a valid number.`);
            }

            if (errorMessages.length) {
                const errorHashKey = `${index}`;
                errorHash[errorHashKey] = errorMessages;
                return undefined;
            }
            
            return {
                bidderId,
                eventId,
                categoryId: associatedCategory!.id,
                itemNumber: parseInt(itemNumber),
                description,
                minimumBid: isNaN(bidFloat) ? bidInteger : bidFloat
            } satisfies ItemCreation;      
        });

        return (Object.keys(errorHash).length ? {
            success: false,
            errors: errorHash
        } : {
            success: true,
            requests: requests.filter(request => request !== undefined)
        });
    }
};