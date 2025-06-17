import { PrismaClient, CategoryCode } from "@prisma/client";

import { SerializeFrom } from "~/commons/general.common";

export type SerializedCategoryCode = SerializeFrom<CategoryCode>;

export type CategoryHash = { [key: number]: SerializedCategoryCode };

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