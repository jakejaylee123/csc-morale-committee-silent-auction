import { PrismaClient, CategoryCode } from "@prisma/client";
import { Dto } from "~/commons/general.common";

export type CategoryHash = { [key: number]: Dto<CategoryCode> };

export class CategoryService {
    private static readonly client = new PrismaClient();

    public static toDto(code: CategoryCode): Dto<CategoryCode> {
        return { ...code };
    }

    public static async getAll(): Promise<CategoryCode[]> {
        return await CategoryService.client.categoryCode.findMany({
            orderBy: [
                { prefix: 'asc' }
            ]
        });
    }
};