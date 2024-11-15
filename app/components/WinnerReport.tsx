import * as React from "react";

import {
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
 } from "@mui/material";

import { SerializedBidWithItemAndBidder } from "~/services/bid.server";
import { SerializedBidder } from "~/services/users.server";
import { SerializedEvent, SerializedItem } from "~/services/event.server";
import { CategoryHash, SerializedCategoryCode } from "~/services/category.server";
import { CategoryCommon } from "~/commons/category.common";
import { ItemTagNumberGenerator, ItemTagNumberSorter } from "~/commons/item.common";
import { MoneyFormatter } from "~/commons/general.common";


export interface WinnerReportProps {
    title: string,
    event: Omit<SerializedEvent, "active" | "concluded">,
    categories: SerializedCategoryCode[],
    winningBids: SerializedBidWithItemAndBidder[],
    disqualifiedItems: SerializedItem[]
};

type WinnerReportDataSourceItem = {
    bidderId: number,
    bidderString: string,
    winningBids: SerializedBidWithItemAndBidder[],
    total: number
};
type WinnerReportDataSource = WinnerReportDataSourceItem[];
export interface WinnerReportDataSourceProps {
    categoryHash: CategoryHash,
    winningBids: SerializedBidWithItemAndBidder[]
};

type DisqualifiedItemsSubReportProps = {
    categoryHash: CategoryHash,
    disqualifiedItems: SerializedItem[]
};

type WinnerSubReportDataSource = WinnerReportDataSource;
type WinnerSubReportProps = {
    categoryHash: CategoryHash,
    source: WinnerSubReportDataSource
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
                bidderId: bid.bidderId,
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
        <>
            <Typography
                align="center"
                sx={{
                    fontWeight: "bold"
                }}
            >Winners:</Typography>
            {
                source.map(({ bidderId, bidderString, winningBids, total }) => {
                    return (
                        <TableContainer key={`winner-table-${bidderId}`}>
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
        </>
    );
}

export function WinnerReport({ title, categories, winningBids, disqualifiedItems }: WinnerReportProps) {
    const categoryHash = CategoryCommon.convertCategoryArrayToHash(categories);
    const source = createWinnerReportDataSource({ winningBids, categoryHash });

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

                <DisqualifiedItemsSubReport
                    disqualifiedItems={disqualifiedItems}
                    categoryHash={categoryHash}
                />

                <WinnerSubReport
                    source={source}
                    categoryHash={categoryHash}
                />
            </Stack>
        </>
    );
}