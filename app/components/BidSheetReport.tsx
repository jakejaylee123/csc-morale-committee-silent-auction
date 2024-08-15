import * as React from "react";

import { SerializedEventWithItems, SerializedItem } from "~/services/event.server";
import { Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { SerializedCategoryCode } from "~/services/category.server";
import { CategoryCommon } from "~/commons/category.common";
import { ItemTagNumberGenerator, ItemTagNumberSorter } from "~/commons/item.common";
import { MoneyFormatter } from "~/commons/general.common";

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
    itemTagNumberGenerator: ItemTagNumberGenerator
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
                    MoneyFormatter.getFormattedMoney({ 
                        amount: item.minimumBid,
                        emptyPlaceholder: ""
                    })
                }
            </TableCell>
            <TableCell>{/* People would enter their bid here. */}</TableCell>
        </>
    );
}

function BidSheetReportRangeHeaderFragment({ items, itemTagNumberGenerator }: BidSheetReportRangeHeaderFragmentProps) {
    const firstItem = items.at(0);
    const lastItem = items.at(-1);
    const rangeString = firstItem && lastItem
        ? `Items ${itemTagNumberGenerator.getItemTagNumber({ 
            categoryId: firstItem.categoryId,
            itemNumber: firstItem.itemNumber
        })} through ${itemTagNumberGenerator.getItemTagNumber({ 
            categoryId: lastItem.categoryId,
            itemNumber: lastItem.itemNumber
        })}` : "";

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
    const categoryHash = CategoryCommon.convertCategoryArrayToHash(categories);
    const generator = new ItemTagNumberGenerator(categoryHash);
    const sorter = new ItemTagNumberSorter(categoryHash);
    const sortedItems = sorter.getSortedItems(event.items);

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
                        fontWeight: "bold",
                    }}
                >{title}</Typography>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <BidSheetReportRangeHeaderFragment
                                    items={leftSide}
                                    itemTagNumberGenerator={generator} />
                                <TableCell sx={{ border: "none !important" }}>{/* Splits the left and right side of the report */}</TableCell>
                                <BidSheetReportRangeHeaderFragment
                                    items={rightSide}
                                    itemTagNumberGenerator={generator} />
                            </TableRow>
                            <TableRow>
                                <BidSheetReportHeaderFragment />
                                <TableCell sx={{ border: "none !important" }}>{/* Splits the left and right side of the report */}</TableCell>
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
                                        <TableCell sx={{ border: "none !important" }}>{/* Splits the left and right side of the report */}</TableCell>
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