import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import { Bidder, CategoryCode, Item } from "@prisma/client";

import { BidWithItemAndBidder } from "~/services/bid.server";
import { EventWithConvenience } from "~/services/event.server";
import { CategoryHash } from "~/services/category.server";
import { CategoryCommon } from "~/commons/category.common";
import { ItemTagNumberGenerator, ItemTagNumberSorter } from "~/commons/item.common";
import { Dto, MoneyFormatter } from "~/commons/general.common";

export type WinnerReportProps = {
    title: string,
    event: Dto<EventWithConvenience>,
    categories: Dto<CategoryCode>[],
    winningBids: Dto<BidWithItemAndBidder>[],
    disqualifiedItems: Dto<Item>[],
    bidderId?: number
};

type WinnerReportDataSourceItem = {
    bidderId: number,
    bidderString: string,
    winningBids: Dto<BidWithItemAndBidder>[],
    total: number
};
type WinnerReportDataSource = WinnerReportDataSourceItem[];
export type WinnerReportDataSourceProps = {
    categoryHash: CategoryHash,
    winningBids: Dto<BidWithItemAndBidder>[]
    bidderId?: number
};

type DisqualifiedItemsSubReportProps = {
    categoryHash: CategoryHash,
    disqualifiedItems: Dto<Item>[]
};

type WinnerSubReportDataSource = WinnerReportDataSource;
type WinnerSubReportProps = {
    categoryHash: CategoryHash,
    source: WinnerSubReportDataSource
};

function createBidderString(bidder: Bidder): string {
    return `${bidder.firstName} ${bidder.lastName} [${bidder.emailAddress}]`;
}

function createWinnerReportDataSource({ winningBids, categoryHash, bidderId }: WinnerReportDataSourceProps): WinnerReportDataSource {
    const sorter = new ItemTagNumberSorter(categoryHash);
    const sortedWinningBids = sorter.getSortedItems(
        winningBids.map(bid => ({
            ...bid,
            categoryId: bid.item.categoryId,
            itemNumber: bid.item.itemNumber
        }))
    );

    const winningBidsHash: { [bidderIdString: string]: WinnerReportDataSourceItem } = {};
    sortedWinningBids
        .filter(bid => !bidderId || bid.bidderId === bidderId)
        .forEach(bid => {
            const bidderIdString = `${bid.bidderId}`;
            if (!winningBidsHash[bidderIdString]) {
                winningBidsHash[bidderIdString] = {
                    bidderId: bid.bidderId,
                    bidderString: createBidderString(bid.bidder),
                    winningBids: [],
                    total: 0
                };
            }
            winningBidsHash[bidderIdString].winningBids.push(bid);
            winningBidsHash[bidderIdString].total += bid.bidAmount;
        });

    return Object.values(winningBidsHash).sort((lhs, rhs) => {
        return lhs.bidderString.localeCompare(rhs.bidderString);
    });
}

function getAuctionEventGrossProfit(bids: Dto<BidWithItemAndBidder>[]): number {
    return bids.reduce((accumulator, bid) => {
        return accumulator + bid.bidAmount;
    }, 0);
}

function DisqualifiedItemsSubReport({ disqualifiedItems, categoryHash }: DisqualifiedItemsSubReportProps) {
    if (!disqualifiedItems.length) {
        return (
            <Typography
                align="center"
                sx={{
                    fontWeight: "bold"
                }}
            >There were no disqualified items.</Typography>
        );
    }

    const generator = new ItemTagNumberGenerator(categoryHash);
    return (
        <>
            <Typography
                align="center"
                sx={{
                    fontWeight: "bold"
                }}
            >Disqualified items:</Typography>
            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Tag number</TableCell>
                            <TableCell>Description</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {
                            disqualifiedItems.map(({ id, categoryId, itemNumber, itemDescription }) => {
                                return (
                                    <TableRow key={`table-row-item-${id}`}>
                                        <TableCell>{generator.getItemTagNumber({
                                            itemNumber,
                                            categoryId
                                        })}</TableCell>
                                        <TableCell>{itemDescription}</TableCell>
                                    </TableRow>
                                );
                            })
                        }
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    );
}

function WinnerSubReport({ source, categoryHash }: WinnerSubReportProps) {
    if (!source.length) {
        return (
            <Typography
                align="center"
                sx={{
                    fontWeight: "bold"
                }}
            >There were no winners.</Typography>
        );
    }

    const generator = new ItemTagNumberGenerator(categoryHash);
    return (
        <Stack
            sx={{
                padding: 0,
                margin: 0,
                marginBottom: 100
            }}
        >
            <Typography
                align="center"
                sx={{
                    fontWeight: "bold"
                }}
            >Winners:</Typography>
            <TableContainer key={`winner-table`}>
                <Table size="small">
                    {
                        source.map(({ bidderString, winningBids, total }) => {
                            return (
                                <>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Item</TableCell>
                                            <TableCell
                                                sx={{ textAlign: "center" }}
                                            >Description</TableCell>
                                            <TableCell
                                                sx={{ textAlign: "right" }}
                                            >Bid</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell></TableCell>
                                            <TableCell sx={{ fontWeight: "bold" }}>
                                                {bidderString}
                                            </TableCell>
                                            <TableCell></TableCell>
                                        </TableRow>
                                        {
                                            winningBids.map((bid) => (
                                                <TableRow key={`table-row-bid-${bid.id}`}>
                                                    <TableCell>{generator.getItemTagNumber({
                                                        categoryId: bid.item.categoryId,
                                                        itemNumber: bid.item.itemNumber
                                                    })}</TableCell>
                                                    <TableCell>
                                                        {bid.item.itemDescription}
                                                    </TableCell>
                                                    <TableCell
                                                        sx={{ textAlign: "right" }}
                                                    >{MoneyFormatter.getFormattedMoney({
                                                        amount: bid.bidAmount
                                                    })}</TableCell>
                                                </TableRow>
                                            ))
                                        }
                                        <TableRow>
                                            <TableCell
                                                colSpan={3}
                                                sx={{ 
                                                    textAlign: "right" 
                                                }}
                                            >{MoneyFormatter.getFormattedMoney({ amount: total})}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell 
                                                colSpan={3} 
                                                sx={{ 
                                                    border: "none !important" ,
                                                    height: 35
                                                }}
                                            />
                                        </TableRow>
                                    </TableBody>
                                </>
                            )
                        })
                    }
                </Table>
            </TableContainer>
        </Stack>
    );
}

export function WinnerReport({ title, categories, winningBids, disqualifiedItems, bidderId }: WinnerReportProps) {
    const categoryHash = CategoryCommon.convertCategoryArrayToHash(categories);
    const source = createWinnerReportDataSource({ winningBids, categoryHash, bidderId });
    const forAllBidders = undefined === bidderId;

    return (
        <>
            <Stack
                spacing={2}
            >
                {forAllBidders &&  
                    <>
                        <Typography
                            variant="h5"
                            align="center"
                            sx={{
                                fontWeight: "bold"
                            }}
                        >{title}</Typography>
                        <Typography
                            align="center"
                            sx={{
                                fontWeight: "bold"
                            }}
                        >{`Auction event gross profit: ${MoneyFormatter.getFormattedMoney({
                            amount: getAuctionEventGrossProfit(winningBids),
                            emptyPlaceholder: "$0.00"
                        })}`}</Typography>

                        <DisqualifiedItemsSubReport
                            disqualifiedItems={disqualifiedItems}
                            categoryHash={categoryHash}
                        />
                    </>
                }

                <WinnerSubReport
                    source={source}
                    categoryHash={categoryHash}
                />
            </Stack>
        </>
    );
}