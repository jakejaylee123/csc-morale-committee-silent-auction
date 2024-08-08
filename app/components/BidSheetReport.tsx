import * as React from "react";

import { SerializedEventWithItems, SerializedItem } from "~/services/event.server";
import { StyledBox } from "./StyledBox";
import { Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { SerializedCategoryCode } from "~/services/category.server";
import { CategoryCode } from "@prisma/client";

type CategoryHash = { [key: number]: SerializedCategoryCode };

export interface BidSheetReportProps {
    title: string,
    event: SerializedEventWithItems,
    categories: SerializedCategoryCode[]
};
interface BidSheetReportRowFragmentProps {
    item: SerializedItem,
    category: SerializedCategoryCode
};
interface BidSheetReportRangeHeaderFragmentProps {
    items: SerializedItem[],
    categoryHash: CategoryHash
};

function BidSheetReportHeaderFragment() {
    return (
        <>
            <TableCell sx={{ fontWeight: "bold" }}>Item</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Description</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Minimum bid</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Your bid</TableCell>
        </>
    )
}

function BidSheetReportEmptyRowFragment() {
    return (
        <>
            <TableCell></TableCell>
            <TableCell></TableCell>
            <TableCell></TableCell>
            <TableCell></TableCell>
        </>
    )
}

function BidSheetReportRowFragment({ item, category }: BidSheetReportRowFragmentProps) {
    return (
        <>
            <TableCell>{`${category.prefix}${item.itemNumber}`}</TableCell>
            <TableCell>{item.itemDescription}</TableCell>
            <TableCell>
                {
                    item.minimumBid ? new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD"
                    }).format(parseFloat(item.minimumBid)) : ""
                }
            </TableCell>
            <TableCell>{/* People would enter their bid here. */}</TableCell>
        </>
    );
}

function BidSheetReportRangeHeaderFragment({ items, categoryHash }: BidSheetReportRangeHeaderFragmentProps) {
    const firstItem = items.at(0);
    const lastItem = items.at(-1);
    const rangeString = firstItem && lastItem
        ? `Items ${categoryHash[firstItem.categoryId].prefix}${firstItem.itemNumber} `
        + `through ${categoryHash[lastItem.categoryId].prefix}${lastItem.itemNumber}`
        : "";

    return (
        <TableCell
            colSpan={4}
            sx={{ fontWeight: "bold" }}
            align="center"
        >{rangeString}</TableCell>
    );
}

export function BidSheetReport({ title, event, categories }: BidSheetReportProps) {
    // We're gonna do a lot of category lookups for this report,
    // so let's index them
    const categoryHash: CategoryHash = {};
    categories.forEach(category => {
        categoryHash[category.id] = category;
    });

    const sortedItems = event.items.sort((lhs, rhs) => {
        const lhsCategory = categoryHash[lhs.categoryId];
        const rhsCategory = categoryHash[rhs.categoryId];
        const prefixComparison = lhsCategory!.prefix.localeCompare(rhsCategory!.prefix);
        return 0 === prefixComparison
            ? rhs.itemNumber - lhs.itemNumber
            : prefixComparison;
    });

    // This should split our items in half so they can
    // fit into two columns
    const splitItems: SerializedItem[][] = [[], []];
    const splitIndex = Math.trunc(sortedItems.length / 2 + 0.5);
    for (let i = 0; i < sortedItems.length; ++i) {
        splitItems[i < splitIndex ? 0 : 1].push(sortedItems[i]);
    }

    const [leftSide, rightSide] = splitItems;
    return (
        <>
            <Stack
                spacing={2}
            >
                <Typography
                    variant="h5"
                    align="center"
                    sx={{
                        display: "flex",
                        fontWeight: "bold",
                        flexDirection: { xs: "column", sm: "row" }
                    }}
                >{title}</Typography>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <BidSheetReportRangeHeaderFragment
                                    items={leftSide}
                                    categoryHash={categoryHash} />
                                <TableCell sx={{ border: "none" }}>{/* Splits the left and right side of the report */}</TableCell>
                                <BidSheetReportRangeHeaderFragment
                                    items={rightSide}
                                    categoryHash={categoryHash} />
                            </TableRow>
                            <TableRow>
                                <BidSheetReportHeaderFragment />
                                <TableCell sx={{ border: "none" }}>{/* Splits the left and right side of the report */}</TableCell>
                                <BidSheetReportHeaderFragment />
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {
                                leftSide.map((_, index) => (
                                    <TableRow>
                                        {
                                            <BidSheetReportRowFragment
                                                item={leftSide[index]}
                                                category={categoryHash[leftSide[index].categoryId]}
                                            />
                                        }
                                        <TableCell sx={{ border: "none" }}>{/* Splits the left and right side of the report */}</TableCell>
                                        {
                                            rightSide[index]
                                                ? <BidSheetReportRowFragment
                                                    item={rightSide[index]}
                                                    category={categoryHash[rightSide[index].categoryId]}
                                                />
                                                : <BidSheetReportEmptyRowFragment />
                                        }
                                    </TableRow>
                                ))
                            }
                        </TableBody>
                    </Table>
                </TableContainer>
            </Stack>
        </>
    );
}