import { EventWithConvenience, SerializedEvent } from "~/services/event.server";

export class EventCommon {
    public static isEnabledAndActive(event: EventWithConvenience | SerializedEvent): boolean {
        return event.enabled && event.active;
    }

    public static isEnabledAndConcluded(event: EventWithConvenience | SerializedEvent): boolean {
        return event.enabled && event.concluded;
    }
};