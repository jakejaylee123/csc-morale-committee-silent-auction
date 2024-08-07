export class Identifiers {
    public static isNew(id: any): id is string {
        return id === "new"
    }

    public static isIntegerId(id: any): id is number {
        const test = parseInt(id);
        return !isNaN(test) && Number.isInteger(test);
    }
}

export type Result<TSuccessValue, TErrorValue> = {
    success: true
    value: TSuccessValue
} | {
    success: false
    error: TErrorValue
};