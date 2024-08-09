import { CategoryHash } from "~/services/category.server";

export type ItemTagNumberGeneratorArgs = {
    categoryId: number,
    itemNumber: number
};
export class ItemTagNumberGenerator {
    private readonly categoryHash: CategoryHash;

    public constructor(categoryHash: CategoryHash) {
        this.categoryHash = categoryHash;
    }

    public getItemTagNumber({ categoryId, itemNumber }: ItemTagNumberGeneratorArgs): string {
        return `${this.categoryHash[categoryId].prefix}${itemNumber}`;
    }
}