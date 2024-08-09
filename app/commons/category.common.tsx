import { CategoryCode } from "@prisma/client";
import { CategoryHash } from "~/services/category.server";

export class CategoryCommon {
    public static convertCategoryArrayToHash(categories: CategoryCode[]): CategoryHash {
        const hash: CategoryHash = {};
        categories.forEach(value => {
            hash[value.id] = value;
        });

        return hash;
    }
};