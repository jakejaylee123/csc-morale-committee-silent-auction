import { PrismaClient, Bid, Item } from "@prisma/client";
import { SerializeFrom } from "@remix-run/node";
import { DateTime } from "luxon";

export type SerializedBid = SerializeFrom<Bid>;

export interface GetBidArgs {
    eventId?: number,
    bidderId?: number,
    itemId?: number,
    withItem?: boolean
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

    public static async getMany({ eventId, bidderId, itemId, withItem }: GetBidArgs): Promise<(Bid | BidWithItem)[]> {
        return await BidService.client.bid.findMany({
            where: { eventId, bidderId, itemId },
            ...(withItem && {
                include: {
                    item: true
                }
            })
        });
    }

    public static async getWinning({ eventId, bidderId, itemId }: GetBidArgs): Promise<BidWithItem[]> {
        const eventBids = await BidService.getMany({ eventId, withItem: true });
        const eventBidsWithItems = eventBids.filter(bid => BidService.isBidWithItem(bid));

        const winningBidsHash: { [itemIdString: string]: BidWithItem } = {};
        eventBidsWithItems.forEach(bid => {
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