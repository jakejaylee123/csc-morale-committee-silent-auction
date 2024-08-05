import { SerializeFrom } from "@remix-run/node";

import { PrismaClient, Event, Item } from "@prisma/client";
import { DateTime } from "luxon";

import { Identifiers } from "./common.server";
import { CategoryService } from "./category.server";

export interface ItemCreation {
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
    errors: { [key: number]: string[] }
}

export class ItemService {
    private static readonly client = new PrismaClient();
    
    public static async createBulkCreationRequest(itemRowArrays: string[][]): Promise<ItemCreationRequestsResult> {
        const errorHash: { [key: number]: string[] } = [];
        const categories = await CategoryService.getAll();
        
        const requests = itemRowArrays.map((array, index) => {
            errorHash[index] = [];
            const [categoryCode, itemNumber, description, minimumBid] = array;
            
            const associatedCategory = categories.find(category => category.prefix === categoryCode);
            if (!associatedCategory) {
                errorHash[index].push(`Proposed category by the prefix of "${categoryCode}" was not found.`);
                return undefined;
            }

            if (!Identifiers.isIntegerId(itemNumber)) {
                errorHash[index].push(`Proposed identifier was not an integer.`);
            }

            if ("" === (description || "").trim()) {
                errorHash[index].push(`No description was provided`);
            }

            const bidInteger = parseInt(minimumBid);
            const bidFloat = parseFloat(minimumBid);
            if ("" !== minimumBid && isNaN(bidInteger) && isNaN(bidFloat)) {
                errorHash[index].push(`Minimum bid must be a valid number.`);
            }

            return {
                categoryId: associatedCategory.id,
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