import { Prisma } from "@prisma/client";

export const APP_NAME = "CSC Silent Auction"

export class Identifiers {
    public static isNew(id: any): id is string {
        return id === "new"
    }

    public static isIntegerId(id: any): id is number {
        const test = parseInt(id);
        return !isNaN(test) && Number.isInteger(test);
    }
}

export type MoneyFormatterArgs = {
    amount: number | string | null | undefined,
    emptyPlaceholder?: string
};
export class MoneyFormatter {
    public static getFormattedMoney({ amount, emptyPlaceholder }: MoneyFormatterArgs): string {
        const placeholderValue = (emptyPlaceholder || "");
        if (undefined === amount || null === amount) {
            return placeholderValue;
        }

        const parsedAmount = typeof amount === "string"
            ? parseFloat(amount) : amount;
        return parsedAmount ? new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD"
        }).format(parsedAmount) : placeholderValue;
    }
}

export type Result<TSuccessValue, TErrorValue> = {
    success: true
    value: TSuccessValue
} | {
    success: false
    error: TErrorValue
};

export type GetPropertyType<T, K extends keyof T> = T[K];

type RemixSingleFetchSupportedTypes =
    | BigInt
    | Date
    | Error
    | Map<any, any>
    | Promise<any>
    | RegExp
    | Set<any>
    | Symbol
    | URL;
type BasicSerializable = string | number | boolean | null | undefined;
type Maybe<T> = T | (T | null) | (T | undefined) | (T | null | undefined);
type ConvertToSerializable<T, U, V> = T extends U 
    ? V
    : T extends U | null
        ? V | null
        : T extends U | undefined
            ? V | undefined
            : T extends U | null | undefined
                ? V | null | undefined
                : never;

export type Dto<T> = {
    [K in keyof T]: T[K] extends BasicSerializable | RemixSingleFetchSupportedTypes
    ? T[K]
    : T[K] extends Maybe<Prisma.Decimal>
        ? ConvertToSerializable<T[K], Prisma.Decimal, number>
        : T[K] extends Maybe<Record<string, any>>
            ? Dto<T[K]>
            : never;
};