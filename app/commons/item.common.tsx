import { Item } from "@prisma/client";
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

export interface SortableItemMinimumProps {
    categoryId: number,
    itemNumber: number
};
export type ItemTagNumberSorterArgs = {
    items: Item[],
    tagNumberGenerator: ItemTagNumberGenerator
};
export class ItemTagNumberSorter {
    private readonly categoryHash: CategoryHash;

    public constructor(categoryHash: CategoryHash) {
        this.categoryHash = categoryHash;
    }

    public getSortedItems<TItem extends SortableItemMinimumProps>(items: TItem[]): TItem[] {
        return items.sort((lhs, rhs) => {
            const lhsCategory = this.categoryHash[lhs.categoryId];
            const rhsCategory = this.categoryHash[rhs.categoryId];
            const prefixComparison = lhsCategory.prefix.localeCompare(rhsCategory.prefix);
            return 0 === prefixComparison
                ? lhs.itemNumber-  rhs.itemNumber
                : prefixComparison;
        });
    }
}