import { PrismaClient, Item } from "@prisma/client";
import { DateTime } from "luxon";

import { Identifiers } from "~/commons/general.common";
import { CategoryService } from "./category.server";

export interface ItemBulkChangeRequestOptions {
    id?: number,
    categoryCodeIsId?: boolean,
    bidderId: number,
    eventId: number,
    itemRowArrays: string[][]
};
export interface ItemUpdate extends ItemCreate {
    id: number
};
export interface ItemCreate {
    bidderId: number,
    eventId: number,
    categoryId: number,
    itemNumber: number,
    description: string,

    // undefined: no update
    // null: clear the minimum bid
    // number: update to new minimum bid
    minimumBid?: number | null
    disqualified?: boolean,
    disqualificationReason?: string | null
};
export type ItemChange = ItemCreate | ItemUpdate;
export type ItemCreationRequestsResult = {
    success: true,
    requests: ItemChange[]
} | {
    success: false,
    errors: { [key: string]: string[] }
}

export class ItemService {
    private static readonly client = new PrismaClient();

    public static async get(itemId: number): Promise<Item | null> {
        return await ItemService.client.item.findUnique({
            where: { id: itemId }
        });
    }

    public static async getForEvent(eventId: number): Promise<Item[]> {
        return await ItemService.client.item.findMany({
            where: { eventId }
        });
    }

    public static async delete(id: number): Promise<void> {
        await ItemService.client.item.delete({
            where: { id }
        });
    }

    public static async updateBulk(requests: ItemUpdate[]): Promise<Item[]> {
        const currentDate = DateTime.now().toUTC().toJSDate();

        return await ItemService.client.$transaction(
            requests.map(({ 
                id,
                bidderId, 
                categoryId, 
                itemNumber,
                description,
                minimumBid,
                disqualified,
                disqualificationReason
            }) => ItemService.client.item.update({
                data: {
                    categoryId,
                    itemNumber,
                    itemDescription: description,
                    minimumBid: minimumBid,
                    ...(undefined !== disqualified && {
                        disqualified,
                        disqualificationReason: disqualified
                            ? disqualificationReason || ""
                            : null,
                        disqualifiedBy: disqualified 
                            ? bidderId
                            : null
                    }),
                    updatedAt: currentDate,
                    updatedBy: bidderId
                },
                where: { id }
            }))
        );
    }

    public static async createBulk(requests: ItemCreate[]): Promise<Item[]> {
        const currentDate = DateTime.now().toUTC().toJSDate();

        return await ItemService.client.$transaction(
            requests.map(({ 
                bidderId, 
                eventId, 
                categoryId, 
                itemNumber,
                description,
                minimumBid
            }) => ItemService.client.item.create({
                data: {
                    eventId,
                    categoryId,
                    itemNumber,
                    itemDescription: description,
                    minimumBid: minimumBid,
                    createdAt: currentDate,
                    createdBy: bidderId
                }
            }))
        );
    }

    public static async createBulkChangeRequest({ 
        id,
        categoryCodeIsId,
        bidderId, 
        eventId,
        itemRowArrays
    }: ItemBulkChangeRequestOptions): Promise<ItemCreationRequestsResult> {
        const errorHash: { [key: string]: string[] } = {};
        const categories = await CategoryService.getAll();
        
        const requests = itemRowArrays.map((array, index) => {
            const errorMessages: string[] = [];
            const [
                categoryCode, 
                itemNumber, 
                description, 
                minimumBid,
                disqualified,
                disqualificationReason
            ] = array;
            
            const associatedCategory = categories.find(category => {
                if (categoryCodeIsId) {
                    return Identifiers.isIntegerId(categoryCode) && category.id === parseInt(categoryCode);
                } else {
                    return category.prefix === categoryCode;
                }
            });
            if (!associatedCategory) {
                errorMessages.push(`Proposed category by the ${categoryCodeIsId ? "ID" : "prefix"} of "${categoryCode}" was not found.`);
            }

            if (!Identifiers.isIntegerId(itemNumber)) {
                errorMessages.push(`Proposed identifier was not an integer.`);
            }

            if ("" === (description || "").trim()) {
                errorMessages.push(`No description was provided`);
            }

            const bidInteger = parseInt(minimumBid);
            const bidFloat = parseFloat(minimumBid);
            const minimumBidEntered = minimumBid && ("null" !== minimumBid);
            if (minimumBidEntered  && isNaN(bidInteger) && isNaN(bidFloat)) {
                errorMessages.push(`Minimum bid must be a valid number.`);
            }

            if (errorMessages.length) {
                const errorHashKey = `${index}`;
                errorHash[errorHashKey] = errorMessages;
                return undefined;
            }
            
            return {
                ...(undefined !== id && { id }),
                bidderId,
                eventId,
                categoryId: associatedCategory!.id,
                itemNumber: parseInt(itemNumber),
                description,
                minimumBid: minimumBid 
                    ? isNaN(bidFloat) ? bidInteger : bidFloat
                    : null,
                ...(disqualified && {
                    disqualified: disqualified === "true",
                    disqualificationReason: disqualified === "true"
                        ? disqualificationReason || ""
                        : null
                })
            } satisfies ItemChange;      
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