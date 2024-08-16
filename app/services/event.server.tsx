import { SerializeFrom } from "@remix-run/node";

import { PrismaClient, Event, Item } from "@prisma/client";
import { DateTime } from "luxon";

export interface EventGetOptions {
    withItems?: boolean,
    withQualifiedItems?: boolean
    withDisqualifiedItems?: boolean
};
export interface EventCreation {
    description: string,
    startDate: DateTime,
    endDate: DateTime,
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

export type SerializedEvent = SerializeFrom<EventWithConvenience>;
export type SerializedNullableEvent = SerializeFrom<EventWithConvenience | null>;
export type SerializedEventWithItems = SerializeFrom<EventWithItems>;
export type SerializedNullableEventWithItems = SerializeFrom<EventWithItems | null>;

export type SerializedItem = SerializeFrom<Item>;

export class EventService {
    private static readonly client = new PrismaClient();

    /**
     * @returns All auctions.
     */
    public static async getAll(): Promise<EventWithConvenience[]> {
        return EventService.injectConvenienceProperties(await EventService.client.event.findMany({}));
    }

    /**
     * @returns All active auctions.
     */
    public static async getEnabledActiveAndPast(): Promise<EventWithConvenience[]> {
        const currentDateTime = new Date().toISOString();
        
        return EventService.injectConvenienceProperties(
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
        const currentDateTime = new Date().toISOString();
        
        return EventService.injectConvenienceProperties(
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
            ? EventService.injectConvenienceProperties([event])[0]
            : null;
    }

    /**
     * @param id ID of the corresponding event to get.
     * @returns Event that corresponds to passed ID.
     */
    public static async create({ creatorId, event }: EventCreateOptions): Promise<EventWithConvenience> {
        const currentDate = DateTime.now().toUTC().toJSDate();

        return EventService.injectConvenienceProperties([
            await EventService.client.event.create({
                data: {
                    description: event.description,
                    startsAt: event.startDate.toUTC().toJSDate(),
                    endsAt: event.endDate.toUTC().toJSDate(),
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
        ])[0];
    }

    /**
     * @param id ID of the corresponding event to get.
     * @returns Event that corresponds to passed ID.
     */
    public static async update({ updatorId, event }: EventUpdateOptions): Promise<EventWithConvenience> {
        const currentDate = DateTime.now().toUTC().toJSDate();

        return EventService.injectConvenienceProperties([
            await EventService.client.event.update({
                where: { id: event.id },
                data: {
                    description: event.description,
                    startsAt: event.startDate.toUTC().toJSDate(),
                    endsAt: event.endDate.toUTC().toJSDate(),
                    createdAt: currentDate,
                    createdBy: updatorId,
                    enabled: event.enabled,
                    releaseWinners: event.releaseWinners,
                    ...(!event.enabled && {
                        disabledAt: currentDate,
                        disabledBy: updatorId
                    })
                }
            })
        ])[0];
    }

    private static injectConvenienceProperties(events: Event[]): EventWithConvenience[] {
        const currentDate = DateTime.now().toUTC().toJSDate();

        return events.map(event => ({
            ...event,
            active: event.startsAt <= currentDate && event.endsAt >=currentDate,
            concluded: event.endsAt <= currentDate
        }));
    }

    private static defaultifyEventGetOptions(options?: EventGetOptions): EventGetOptions {
        return {
            withItems: options?.withItems || false,
            withQualifiedItems: options?.withQualifiedItems || false,
            withDisqualifiedItems: options?.withDisqualifiedItems || false
        };
    }
};