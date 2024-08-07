import { PrismaClient, CategoryCode } from "@prisma/client";
import { SerializeFrom } from "@remix-run/node";

export type SerializedCategoryCode = SerializeFrom<CategoryCode>;

export interface ItemCreation {
    categoryId: string,
    itemNumber: number,
    description: string,
    minimumBid?: number
};

export class CategoryService {
    private static readonly client = new PrismaClient();

    public static async getAll(): Promise<CategoryCode[]> {
        return await CategoryService.client.categoryCode.findMany({
            orderBy: [
                { prefix: 'asc' }
            ]
        });
    }
};