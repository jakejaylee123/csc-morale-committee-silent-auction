import * as React from "react";

import { SerializedEvent } from "~/services/event.server";
import { Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { CategoryHash, SerializedCategoryCode } from "~/services/category.server";
import { CategoryCommon } from "~/commons/category.common";
import { ItemTagNumberGenerator, ItemTagNumberSorter } from "~/commons/item.common";
import { MoneyFormatter } from "~/commons/general.common";
import { SerializedBidWithItemAndBidder } from "~/services/bid.server";
import { SerializedBidder } from "~/services/users.server";

export interface WinnerReportProps {
    title: string,
    event: SerializedEvent,
    categories: SerializedCategoryCode[],
    winningBids: SerializedBidWithItemAndBidder[]
};

type WinnerReportDataSourceItem = {
    bidderString: string,
    winningBids: SerializedBidWithItemAndBidder[],
    total: number
};
type WinnerReportDataSource = WinnerReportDataSourceItem[];
export interface WinnerReportDataSourceProps {
    categoryHash: CategoryHash,
    winningBids: SerializedBidWithItemAndBidder[]
};

function createBidderString(bidder: SerializedBidder): string {
    return `${bidder.firstName} ${bidder.lastName} [${bidder.emailAddress}]`;
}

function createWinnerReportDataSource({ winningBids, categoryHash }: WinnerReportDataSourceProps): WinnerReportDataSource {
    const sorter = new ItemTagNumberSorter(categoryHash);
    const sortedWinningBids = sorter.getSortedItems(
        winningBids.map(bid => ({
            ...bid,
            categoryId: bid.item.categoryId,
            itemNumber: bid.item.itemNumber
        }))
    );

    const winningBidsHash: { [bidderIdString: string]: WinnerReportDataSourceItem } = {};
    sortedWinningBids.forEach(bid => { 
        const bidderIdString = `${bid.bidderId}`;
        if (!winningBidsHash[bidderIdString]) {
            winningBidsHash[bidderIdString] = {
                bidderString: createBidderString(bid.bidder),
                winningBids: [],
                total: 0
            };
        }
        winningBidsHash[bidderIdString].winningBids.push(bid);
        winningBidsHash[bidderIdString].total += parseFloat(bid.bidAmount);
    });

    return Object.values(winningBidsHash).sort((lhs, rhs) => {
        return lhs.bidderString.localeCompare(rhs.bidderString);
    });
}

function getAuctionEventGrossProfit(bids: SerializedBidWithItemAndBidder[]): number {
    return bids.reduce((accumulator, bid) => {
        return accumulator + parseFloat(bid.bidAmount);
    }, 0);
}

export function WinnerReport({ title, categories, winningBids }: WinnerReportProps) {
    const categoryHash = CategoryCommon.convertCategoryArrayToHash(categories);
    const source = createWinnerReportDataSource({ winningBids, categoryHash });
    const generator = new ItemTagNumberGenerator(categoryHash);

    return (
        <>
            <Stack
                spacing={2}
            >
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
                {
                    source.map(({ bidderString, winningBids, total }) => {
                        return (
                            <TableContainer>
                                <Table size="small">
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
                                                <TableRow>
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
                                            <TableCell></TableCell>
                                            <TableCell></TableCell>
                                            <TableCell
                                                sx={{ textAlign: "right" }}
                                            >{MoneyFormatter.getFormattedMoney({
                                                amount: total
                                            })}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )
                    })
                }
            </Stack>
        </>
    );
}