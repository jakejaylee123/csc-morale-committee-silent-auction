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