import { PrismaClient, Event, Item } from "@prisma/client";
import { DateTime } from "luxon";
import { Dto } from "~/commons/general.common";
import { ItemService } from "./item.server";

export type NewEvent = Omit<Partial<Event>, "id"> & Pick<Event, "description" | "enabled" | "releaseWinners" | "startsAt" | "endsAt"> & {
    id: "new"
};
export type NewOrExistingEvent = Omit<(Event | NewEvent), "id"> & {
    id: number | "new",
    timezone?: string
};

export interface EventGetOptions {
    withItems?: boolean,
    withQualifiedItems?: boolean
    withDisqualifiedItems?: boolean
};
export interface EventCreation {
    description: string,
    startDate: Date,
    endDate: Date,
    enabled: boolean
};
export interface EventUpdate extends EventCreation {
    id: number,
    releaseWinners: boolean
};
export interface EventCreateOptions {
    creatorId: number,
    event: EventCreation
};
export interface EventUpdateOptions {
    updatorId: number,
    event: EventUpdate
};

export type EventWithConvenience = Event & {
    active: boolean,
    concluded: boolean
};
export type EventWithItems = EventWithConvenience & { items: Item[] };

export class EventService {
    private static readonly client = new PrismaClient();

    public static toDto(event: Event): Dto<Event> {
        return {
            ...event
        };
    }

    public static toDtoWithConvenience(event: EventWithConvenience): Dto<EventWithConvenience> {
        return {
            ...event
        };
    }

    public static toDtoWithItems(event: EventWithItems): Dto<EventWithItems> {
        return {
            ...event,
            items: event.items.map(ItemService.toDto)
        };
    }

    /**
     * @returns All auctions.
     */
    public static async getAll(): Promise<EventWithConvenience[]> {
        return EventService.injectEventsWithConvenienceProperties(await EventService.client.event.findMany({}));
    }

    /**
     * @returns All active auctions.
     */
    public static async getEnabledActiveAndPast(): Promise<EventWithConvenience[]> {
        const currentDateTime = DateTime.utc().toJSDate();
        
        return EventService.injectEventsWithConvenienceProperties(
            await EventService.client.event.findMany({
                where: { 
                    disabledAt: {
                        equals: null
                    },
                    startsAt: {
                        lte: currentDateTime
                    }
                }
            })
        );
    }

    /**
     * @returns All active auctions.
     */
    public static async getActive(): Promise<EventWithConvenience[]> {
        const currentDateTime = DateTime.utc().toJSDate();
        
        return EventService.injectEventsWithConvenienceProperties(
            await EventService.client.event.findMany({
                where: { 
                    startsAt: {
                        lte: currentDateTime
                    },
                    endsAt: {
                        gte: currentDateTime
                    }
                }
            })
        );
    }

    /**
     * @param id ID of the corresponding event to get.
     * @returns Event that corresponds to passed ID.
     */
    public static async get(id: number, options?: ({ withItems: true } | { withQualifiedItems: true } | { withDisqualifiedItems: true }) & EventGetOptions): Promise<EventWithItems | null>;
    public static async get(id: number, options?: EventGetOptions): Promise<EventWithItems | EventWithConvenience | null> {
        options = EventService.defaultifyEventGetOptions(options);

        const event = await EventService.client.event.findUnique({
            where: { id },
            ...(options.withItems && { 
                include: { 
                    items: true
                }
            }),
            ...(options.withQualifiedItems && ({
                include: {
                    items: {
                        where: {
                            disqualified: false
                        }
                    }
                }
            })),
            ...(options.withDisqualifiedItems && ({
                include: {
                    items: {
                        where: {
                            disqualified: true
                        }
                    }
                }
            }))
        });

        return event
            ? EventService.injectEventWithConvenienceProperties(event)
            : null;
    }

    /**
     * @param id ID of the corresponding event to get.
     * @returns Event that corresponds to passed ID.
     */
    public static async create({ creatorId, event }: EventCreateOptions): Promise<EventWithConvenience> {
        const currentDate = DateTime.utc().toJSDate();

        return EventService.injectEventWithConvenienceProperties(
            await EventService.client.event.create({
                data: {
                    description: event.description,
                    startsAt: event.startDate,
                    endsAt: event.endDate,
                    createdAt: currentDate,
                    createdBy: creatorId,
                    enabled: event.enabled,
                    disabledAt: null,
                    disabledBy: null,
                    ...(!event.enabled && {
                        disabledAt: currentDate,
                        disabledBy: creatorId
                    })
                }
            })
        );
    }

    /**
     * @param id ID of the corresponding event to get.
     * @returns Event that corresponds to passed ID.
     */
    public static async update({ updatorId, event }: EventUpdateOptions): Promise<EventWithConvenience> {
        const currentDate = DateTime.utc().toJSDate();

        return EventService.injectEventWithConvenienceProperties(
            await EventService.client.event.update({
                where: { id: event.id },
                data: {
                    enabled: event.enabled,
                    description: event.description,
                    startsAt: event.startDate,
                    endsAt: event.endDate,
                    releaseWinners: event.releaseWinners,
                    updatedAt: currentDate,
                    updatedBy: updatorId,
                    disabledAt: null,
                    disabledBy: null,
                    ...(!event.enabled && {
                        disabledAt: currentDate,
                        disabledBy: updatorId
                    })
                }
            })
        );
    }

    private static injectEventWithConvenienceProperties(event: Event, currentDate?: Date): EventWithConvenience {
        const dateToUse = currentDate || DateTime.utc().toJSDate();
        return {
            ...event,
            active: event.startsAt <= dateToUse && event.endsAt >= dateToUse,
            concluded: event.endsAt <= dateToUse
        };
    }

    private static injectEventsWithConvenienceProperties(events: Event[]): EventWithConvenience[] {
        const currentDate = DateTime.utc().toJSDate();
        return events.map(event => EventService.injectEventWithConvenienceProperties(event, currentDate));
    }

    private static defaultifyEventGetOptions(options?: EventGetOptions): EventGetOptions {
        return {
            withItems: options?.withItems || false,
            withQualifiedItems: options?.withQualifiedItems || false,
            withDisqualifiedItems: options?.withDisqualifiedItems || false
        };
    }
};