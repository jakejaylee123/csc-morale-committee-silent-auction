import { PrismaClient, Bid, Item, Bidder } from "@prisma/client";
import { SerializeFrom } from "@remix-run/node";
import { DateTime } from "luxon";

export type SerializedBid = SerializeFrom<Bid>;

export type GetBidArgs = {
    bidId?: number,
    eventId?: number,
    bidderId?: number,
    itemId?: number,
    withItem?: boolean,
    withBidder?: boolean
}

export interface BidCreation {
    eventId: number,
    bidderId: number,
    itemId: number,
    bidAmount: number
};

export type BidWithItem = Bid & {
    item: Item
};
export type SerializedBidWithItem = SerializeFrom<BidWithItem>;

export type BidWithItemAndBidder = BidWithItem & {
    bidder: Bidder
};
export type SerializedBidWithItemAndBidder = SerializeFrom<BidWithItemAndBidder>;

type BidComparisonField = keyof Bid;
const DefaultBidComparisonFields: readonly BidComparisonField[] = [
    "bidAmount",
    "createdAt"
];

export class BidService {
    private static readonly client = new PrismaClient();

    public static async get({ eventId, bidderId, itemId }: GetBidArgs): Promise<Bid | null> {
        return await BidService.client.bid.findFirst({
            where: { eventId, bidderId, itemId }
        });
    }

    public static async getMany({
        bidId,
        eventId, 
        bidderId, 
        itemId, 
        withItem,
        withBidder
    }: GetBidArgs): Promise<(Bid | BidWithItem | BidWithItemAndBidder)[]> {
        return await BidService.client.bid.findMany({
            where: { id: bidId, eventId, bidderId, itemId },
            include: {
                ...(withItem && { item: true }),
                ...(withBidder && { bidder: true })
            },
            orderBy: [
                { bidAmount: "desc" },
                { createdAt: "asc" }
            ]
        });
    }

    public static async getWinning({
        eventId, 
        bidderId, 
        itemId, 
        withItem, 
        withBidder 
    }: GetBidArgs): Promise<(BidWithItemAndBidder | BidWithItem| Bid)[]> {
        const eventBids = await BidService.getMany({ 
            eventId, 
            withItem,
            withBidder
        });

        const eventBidsWithItems = eventBids
            .filter(bid => BidService.isBidWithItem(bid));
        const biddedItems = eventBidsWithItems.map(bid => bid.item);
        const winningBids = biddedItems.map(item => eventBidsWithItems.find(bid => bid.itemId === item.id));
        
        const winningBidsHash: { [itemIdString: string]: BidWithItem } = {};
        for (const bid of winningBids) {
            winningBidsHash[`${bid?.itemId}`] = bid as BidWithItem;
        }

        return Object.values(winningBidsHash)
            .filter(bid => undefined === bidderId || bidderId === bid.bidderId)
            .filter(bid => undefined === itemId || itemId === bid.itemId);
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

    public static async disqualify(disqualifyingBidderId: number, { bidId, eventId, bidderId, itemId }: GetBidArgs): Promise<Bid> {
        const currentDate = DateTime.now().toUTC().toJSDate();

        return await BidService.client.bid.update({
            where: { id: bidId, eventId, bidderId, itemId }, 
            data: {
                disqualified: true,
                disqualifiedBy: disqualifyingBidderId,
                disqualifiedAt: currentDate
            }
        });
    }

    public static isBidWithItem(bid: Bid): bid is BidWithItem {
        return !!(bid as BidWithItem).item;
    }

    public static isBidWithItemAndBidder(bid: Bid): bid is BidWithItemAndBidder {
        return BidService.isBidWithItem(bid) && !!(bid as BidWithItemAndBidder).bidder;
    }

    public static compareBids(lhs: Bid, rhs: Bid): number {
        for (let field of DefaultBidComparisonFields) {
            const lhsFieldValue = lhs[field];
            const rhsFieldValue = rhs[field];
            if (null === lhsFieldValue || null === rhsFieldValue) {
                throw new Error(`Cannot compare null values of bid fields.`);
            } else if (lhsFieldValue > rhsFieldValue) {
                return -1;
            } else if (lhsFieldValue < rhsFieldValue) {
                return 1;
            }
        }

        return 0;
    }
};