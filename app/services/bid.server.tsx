import { PrismaClient, Bid } from "@prisma/client";
import { SerializeFrom } from "@remix-run/node";
import { DateTime } from "luxon";

export type SerializedBid = SerializeFrom<Bid>;

export interface GetBidArgs {
    eventId?: number,
    bidderId?: number,
    itemId?: number
};

export interface BidCreation {
    eventId: number,
    bidderId: number,
    itemId: number,
    bidAmount: number
}

export class BidService {
    private static readonly client = new PrismaClient();

    public static async get({ eventId, bidderId, itemId }: GetBidArgs): Promise<Bid | null> {
        return await BidService.client.bid.findFirst({
            where: { eventId, bidderId, itemId }
        });
    }

    public static async getMany({ eventId, bidderId, itemId }: GetBidArgs): Promise<Bid[]> {
        return await BidService.client.bid.findMany({
            where: { eventId, bidderId, itemId }
        });
    }

    public static async create({ eventId, bidderId, itemId, bidAmount }: BidCreation): Promise<Bid> {
        const currentDate = DateTime.now().toUTC().toJSDate();

        return await BidService.client.bid.create({
            data: {
                bidderId,
                eventId,
                itemId,
                bidAmount,
                createdAt: currentDate,
                createdBy: bidderId,
                disqualified: false
            }
        })
    }
};