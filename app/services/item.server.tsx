import { PrismaClient, Item } from "@prisma/client";
import { DateTime } from "luxon";

import { BasicDto, Dto, Identifiers } from "~/commons/general.common";
import { CategoryService } from "./category.server";

export type ItemWithJustId = Pick<Item, "id">;
export type NewItem = Omit<Partial<Item>, "id"> & Pick<Item, "eventId" | "itemNumber" | "itemDescription" | "minimumBid" | "categoryId"> & {
    id: "new"
};
export type NewOrExistingItem = (Item | NewItem) & {
    categoryPrefix?: string
};

export interface ItemBulkChangeRequestOptions {
    bidderId: number,
    itemRequests: BasicDto<NewOrExistingItem>[]
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

    public static toDto(item: Item): Dto<Item> {
        return {
            ...item,
            minimumBid: item.minimumBid?.toNumber() || null
        };
    }

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
        bidderId, 
        itemRequests
    }: ItemBulkChangeRequestOptions): Promise<ItemCreationRequestsResult> {
        const errorHash: { [key: string]: string[] } = {};
        const categories = await CategoryService.getAll();
        
        const requests = itemRequests.map((request, index) => {
            const errorMessages: string[] = [];
            const {
                id,
                eventId,
                categoryId,
                categoryPrefix,
                itemDescription,
                minimumBid,
                disqualified,
                disqualificationReason
            } = request;
            
            const associatedCategory = categories.find(category => {
                if (categoryPrefix) {
                    return categoryPrefix === category.prefix;
                } else {
                    return categoryId === category.id;
                }
            });
            if (!associatedCategory) {
                const categoryIdenitifierType = categoryPrefix ? "prefix" : "ID";
                const categoryIdenitifier = categoryPrefix || categoryId;
                errorMessages.push(`Proposed category by the ${categoryIdenitifierType} of "${categoryIdenitifier}" was not found.`);
            }

            if (!Identifiers.isNew(id) && !Identifiers.isIntegerId(id)) {
                errorMessages.push(`Proposed identifier was not an integer.`);
            }

            if ("" === (itemDescription || "").trim()) {
                errorMessages.push(`No description was provided`);
            }

            if (minimumBid && isNaN(minimumBid)) {
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
                itemNumber: request.itemNumber,
                description: itemDescription,
                minimumBid: minimumBid || null,
                ...(request.disqualified && {
                    disqualified: disqualified,
                    disqualificationReason: disqualified
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