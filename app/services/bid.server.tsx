import { PrismaClient, Bid, Item, Bidder } from "@prisma/client";
import { SerializeFrom } from "@remix-run/node";
import { DateTime } from "luxon";

export type SerializedBid = SerializeFrom<Bid>;

export interface GetBidArgs {
    eventId?: number,
    bidderId?: number,
    itemId?: number,
    withItem?: boolean,
    withBidder?: boolean
};

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
        eventId, 
        bidderId, 
        itemId, 
        withItem,
        withBidder
    }: GetBidArgs): Promise<(Bid | BidWithItem | BidWithItemAndBidder)[]> {
        return await BidService.client.bid.findMany({
            where: { eventId, bidderId, itemId },
            include: {
                ...(withItem && { item: true }),
                ...(withBidder && { bidder: true })
            }
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

        const eventBidsWithItems = eventBids.filter(bid => BidService.isBidWithItem(bid));
        const winningBidsHash: { [itemIdString: string]: BidWithItem } = {};
        eventBidsWithItems.forEach(bid => {
            if (bid.disqualified || bid.item.disqualified) {
                return;
            }

            const bidItemKey = `${bid.itemId}`;
            if (!winningBidsHash[bidItemKey]) {
                winningBidsHash[bidItemKey] = bid;
            } else {
                const currentWinningBid = winningBidsHash[bidItemKey];
                const comparison = BidService.compareBids(currentWinningBid, bid);
                winningBidsHash[bidItemKey] = comparison > 0
                    ? bid : currentWinningBid;
            }
        });

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
        })
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