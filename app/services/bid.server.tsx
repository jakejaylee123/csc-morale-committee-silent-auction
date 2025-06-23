import { PrismaClient, Bid, Item, Bidder } from "@prisma/client";
import { DateTime } from "luxon";
import { Dto } from "~/commons/general.common";
import { ItemService } from "./item.server";
import { BidderService } from "./users.server";

type BidVariant = Bid | BidWithItem | BidWithBidder | BidWithItemAndBidder;

type GetBidArgs = {
    forEventId: number,
    forBidderId: number,
    forItemId: number
};

type InclusionArgs = {
    withItem?: boolean,
    withBidder?: boolean
};

export type GetBidsArgs = {
    forBidId?: number,
    forEventId?: number,
    forBidderId?: number,
    forItemId?: number
} & InclusionArgs;

type GetWinningBidsFilterArgs = { forEventId: number } & ({
    forItemId?: undefined,
    forBidderId: number
} | {
    forItemId: number,
    forBidderId?: undefined
} | {
    forItemId?: undefined,
    forBidderId?: undefined
});
export type GetWinningBidsArgs = GetWinningBidsFilterArgs & InclusionArgs;

export interface BidCreation {
    eventId: number,
    bidderId: number,
    itemId: number,
    bidAmount: number
};

export type BidWithItem = Bid & {
    item: Item
};
export type BidWithBidder = Bid & {
    bidder: Bidder
};
export type BidWithItemAndBidder = BidWithItem & BidWithBidder;

export class BidService {
    private static readonly client = new PrismaClient();

    public static toDto(bid: Bid): Dto<Bid> {
        return {
            ...bid,
            bidAmount: bid.bidAmount.toNumber()
        }   
    }

    public static toDtoWithItem(bid: BidWithItem): Dto<BidWithItem> {
        return {
            ...bid,
            bidAmount: bid.bidAmount.toNumber(),
            item: ItemService.toDto(bid.item)
        };
    }

    public static toDtoWithBidder(bid: BidWithBidder): Dto<BidWithBidder> {
        return {
            ...bid,
            bidAmount: bid.bidAmount.toNumber(),
            bidder: BidderService.toDto(bid.bidder)
        };
    }

    public static toDtoWithItemAndBidder(bid: BidWithItemAndBidder): Dto<BidWithItemAndBidder> {
        return {
            ...bid,
            bidAmount: bid.bidAmount.toNumber(),
            item: ItemService.toDto(bid.item),
            bidder: BidderService.toDto(bid.bidder)
        };
    }

    public static async getById(id: number): Promise<Bid | null | undefined> {
        return await BidService.client.bid.findUnique({
            where: { id }
        });
    }

    public static async get(args: GetBidArgs): Promise<Bid | null | undefined> {
        return await BidService.client.bid.findFirst({
            where: {
                eventId: args.forEventId,
                bidderId: args.forBidderId,
                itemId: args.forItemId
            }
        });
    }

    public static async getMany(args: { withItem: true, withBidder: true } & GetBidsArgs): Promise<BidWithItemAndBidder[]>;
    public static async getMany(args: { withItem: true } & GetBidsArgs): Promise<BidWithItem[]>;
    public static async getMany(args: { withBidder: true } & GetBidsArgs): Promise<BidWithBidder[]>;
    public static async getMany(args: GetBidsArgs): Promise<Bid[]>;
    public static async getMany({
        forEventId, 
        forBidderId, 
        forItemId, 
        withItem,
        withBidder
    }: GetBidsArgs): Promise<BidVariant[]> {
        return await BidService.client.bid.findMany({
            relationLoadStrategy: "join",
            where: { 
                ...(forEventId && { eventId: forEventId }), 
                ...(forBidderId && { bidderId: forBidderId }),
                ...(forItemId && { itemId: forItemId })
            },
            include: {
                ...(withItem && { item: true }),
                ...(withBidder && { bidder: true })
            },
            orderBy: [
                { itemId: "asc" },
                { bidAmount: "desc" },
                { createdAt: "asc" }
            ]
        });
    }

    public static async getWinning(args: { withItem: true, withBidder: true } & GetWinningBidsArgs): Promise<BidWithItemAndBidder[]>;
    public static async getWinning(args: { withItem: true } & GetWinningBidsArgs): Promise<BidWithItem[]>;
    public static async getWinning(args: { withBidder: true } & GetWinningBidsArgs): Promise<BidWithBidder[]>;
    public static async getWinning(args: GetWinningBidsArgs): Promise<Bid[]>;
    public static async getWinning({
        forEventId,
        forBidderId,
        forItemId,
        withBidder,
        withItem
    }: GetWinningBidsArgs): Promise<BidVariant[]> {
        const eventBids = await BidService.getMany({
            forEventId,
            forBidderId,
            forItemId,
            withBidder,
            withItem
        });
        
        const winningBids: BidVariant[] = []
        for (const bid of eventBids) {
            const canAddWinningBid = 
                (!winningBids.length || winningBids[winningBids.length - 1].itemId !== bid.itemId)
                && (!forEventId || forEventId === bid.eventId)
                && (!forBidderId || forBidderId === bid.bidderId)
                && (!forItemId || forItemId === bid.itemId);
            
            if (canAddWinningBid) winningBids.push(bid);
        }
        
        return winningBids;
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
        });
    }

    public static async disqualify(id: number, disqualifyingBidderId: number): Promise<Bid> {
        const currentDate = DateTime.now().toUTC().toJSDate();

        return await BidService.client.bid.update({
            where: { id },
            data: {
                disqualified: true,
                disqualifiedBy: disqualifyingBidderId,
                disqualifiedAt: currentDate
            }
        });
    }
};