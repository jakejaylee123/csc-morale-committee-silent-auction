import { EventWithConvenience } from "~/services/event.server";

export class EventCommon {
    public static isEnabledAndActive(event: EventWithConvenience): boolean {
        return event.enabled && event.active;
    }

    public static isEnabledAndConcluded(event: EventWithConvenience): boolean {
        return event.enabled && event.concluded;
    }
};