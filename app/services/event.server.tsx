import { SerializeFrom } from "@remix-run/node";

import { PrismaClient, Event, Item } from "@prisma/client";
import { DateTime } from "luxon";

export interface EventGetOptions {
    withItems?: boolean
};
export interface EventCreation {
    description: string,
    startDate: DateTime,
    endDate: DateTime,
    enabled: boolean
};
export interface EventUpdate extends EventCreation {
    id: number
};
export interface EventCreateOptions {
    creatorId: number,
    event: EventCreation
};
export interface EventUpdateOptions {
    updatorId: number,
    event: EventUpdate
};

export type EventWithItems = Event & { items: Item[] };

export type SerializedEvent = SerializeFrom<Event>;
export type SerializedNullableEvent = SerializeFrom<Event | null>;
export type SerializedEventWithItems = SerializeFrom<EventWithItems>;
export type SerializedNullableEventWithItems = SerializeFrom<EventWithItems | null>;

export type SerializedItem = SerializeFrom<Item>;

export class EventService {
    private static readonly client = new PrismaClient();

    /**
     * @returns All auctions.
     */
    public static async getAll(): Promise<Event[]> {
        return await EventService.client.event.findMany({});
    }

    /**
     * @returns All active auctions.
     */
    public static async getActive(): Promise<Event[]> {
        const currentDateTime = new Date().toISOString();
        
        return await EventService.client.event.findMany({
            where: { 
                startsAt: {
                    lte: currentDateTime
                },
                endsAt: {
                    gte: currentDateTime
                }
            }
        });
    }

    /**
     * @param id ID of the corresponding event to get.
     * @returns Event that corresponds to passed ID.
     */
    public static async get(id: number, options?: EventGetOptions): Promise<EventWithItems | Event | null> {
        options = EventService.defaultifyEventGetOptions(options);

        return await EventService.client.event.findUnique({
            where: { id },
            ...(options.withItems && { 
                include: { 
                    items: true
                }
            })
        });
    }

    /**
     * @param id ID of the corresponding event to get.
     * @returns Event that corresponds to passed ID.
     */
    public static async create({ creatorId, event }: EventCreateOptions): Promise<Event> {
        const currentDate = DateTime.now().toUTC().toJSDate();

        return await EventService.client.event.create({
            data: {
                description: event.description,
                startsAt: event.startDate.toUTC().toJSDate(),
                endsAt: event.endDate.toUTC().toJSDate(),
                createdAt: currentDate,
                createdBy: creatorId,
                enabled: event.enabled,
                ...(!event.enabled && {
                    disabledAt: currentDate,
                    disabledBy: creatorId
                })
            }
        });
    }

    /**
     * @param id ID of the corresponding event to get.
     * @returns Event that corresponds to passed ID.
     */
    public static async update({ updatorId, event }: EventUpdateOptions): Promise<Event> {
        const currentDate = DateTime.now().toUTC().toJSDate();

        return await EventService.client.event.update({
            where: { id: event.id },
            data: {
                description: event.description,
                startsAt: event.startDate.toUTC().toJSDate(),
                endsAt: event.endDate.toUTC().toJSDate(),
                createdAt: currentDate,
                createdBy: updatorId,
                enabled: event.enabled,
                ...(!event.enabled && {
                    disabledAt: currentDate,
                    disabledBy: updatorId
                })
            }
        });
    }

    private static defaultifyEventGetOptions(options?: EventGetOptions): EventGetOptions {
        return {
            withItems: options?.withItems || false
        };
    }
};