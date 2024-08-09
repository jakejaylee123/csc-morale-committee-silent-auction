import * as React from "react";
import { useFetcher } from "@remix-run/react";

import { SerializedEventWithItems } from "~/services/event.server";
import { Alert, AlertProps, Button, ButtonGroup, Snackbar, Stack, Typography } from "@mui/material";
import { DataGrid, GridActionsCellItemProps, GridColDef, GridColumnVisibilityModel, GridEventListener, GridFilterModel, GridRowClassNameParams, GridRowEditStopReasons, GridRowParams } from "@mui/x-data-grid";

import { CategoryHash, SerializedCategoryCode } from "~/services/category.server";
import { SerializedBid } from "~/services/bid.server";

import { ItemTagNumberGenerator } from "~/commons/item.common";
import { MoneyFormatter } from "~/commons/general.common";
import { CategoryCommon } from "~/commons/category.common";

import { StyledBox } from "./StyledBox";
import { QuickSearchFilterCheckbox, QuickSearchToolbar } from "./QuickSearchToolbar";
import { SerializedBidUpdateResult } from "~/routes/events.$id.bids.update";
import { StandardSnackbar } from "./StandardSnackbar";
import { StandardAlert } from "./StandardAlert";
import { StandardOkModal } from "./StandardModal";

export interface BidEditorProps {
    event: SerializedEventWithItems,
    categories: SerializedCategoryCode[],
    bids: SerializedBid[]
}

interface BidEditorDataSourceArgs {
    event: SerializedEventWithItems,
    categoryHash: CategoryHash,
    bids: SerializedBid[]
};
interface BidEditorDataSourceItem {
    // This ID is only used for the DataGridView we're using
    id: number

    itemId: number,
    categoryPrefix: string,
    itemNumber: number,
    itemTagNumber: string,
    itemDescription: string,
    minimumBid?: number,
    confirmed: boolean,
    bidAmount?: number
};
type BidEditorDataSource = BidEditorDataSourceItem[];

type BidConfirmButtonCreatorArgs = {
    params: GridRowParams<BidEditorDataSourceItem>,
    onClick?: React.MouseEventHandler<HTMLButtonElement>
};
type BidConfirmButtonCreator = (
    args: BidConfirmButtonCreatorArgs
) => readonly React.ReactElement<GridActionsCellItemProps>[];

type GetConfirmedBidTotalArgs = {
    dataSource: BidEditorDataSource
    asFormattedString?: boolean
};

function createBidEditorDataSource({ event, categoryHash, bids }: BidEditorDataSourceArgs) {
    const generator = new ItemTagNumberGenerator(categoryHash);

    return event.items.map(item => {
        const currentBid = bids.find(bid => bid.itemId === item.id);
        const minimumBid = item.minimumBid
            ? parseFloat(item.minimumBid) : undefined;
        const bidAmount = currentBid?.bidAmount
            ? parseFloat(currentBid.bidAmount) : undefined;

        return {
            itemId: item.id,
            categoryPrefix: categoryHash[item.categoryId].prefix,
            itemNumber: item.itemNumber,
            itemTagNumber: generator.getItemTagNumber({
                categoryId: item.categoryId,
                itemNumber: item.itemNumber
            }),
            itemDescription: item.itemDescription,
            minimumBid,
            confirmed: !!currentBid,
            bidAmount
        };
    }).sort((lhs, rhs) => {
        const prefixComparison = lhs.categoryPrefix.localeCompare(rhs.categoryPrefix);
        return 0 === prefixComparison
            ? rhs.itemNumber - lhs.itemNumber
            : prefixComparison;
    }).map((item, index) => ({
        ...item,
        id: index + 1
    } satisfies BidEditorDataSourceItem));
}

const createBidConfirmButton: BidConfirmButtonCreator = function ({ params, onClick }) {
    return [(
        <ButtonGroup>
            <Button
                color="primary"
                variant={(params.row.confirmed || !params.row.bidAmount) ? undefined : "contained"}
                disabled={params.row.confirmed || !params.row.bidAmount}
                onClick={onClick}
            >{params.row.confirmed ? "Confirmed" : "Confirm"}</Button>
        </ButtonGroup>
    )];
};

const getRowClassName = function (params: GridRowClassNameParams<BidEditorDataSourceItem>): string {
    return params.row.confirmed ? "confirmed" : "";
}

const getConfirmedBidTotal = function ({ dataSource, asFormattedString }: GetConfirmedBidTotalArgs): number | string {
    const sum = dataSource
        .filter(item => item.confirmed && item.bidAmount)
        .reduce((accumulator, item) => accumulator + (item.bidAmount || 0), 0);
    return asFormattedString ? MoneyFormatter.getFormattedMoney({
        amount: sum
    }) : sum;
};

export function BidEditor({ event, categories, bids }: BidEditorProps) {
    const categoryHash = React.useRef(CategoryCommon.convertCategoryArrayToHash(categories));
    const [currentBids, setCurrentBids] = React.useState(bids || []);
    const [auctionConcludedModalOpen, setAuctionConcludedModalOpen] = React.useState(false);

    const [rows, setRows] = React.useState<BidEditorDataSource>(createBidEditorDataSource({
        event,
        categoryHash: categoryHash.current,
        bids: currentBids
    }));

    const [snackbar, setSnackbar] = React.useState<Pick<
        AlertProps,
        'children' | 'severity'
    > | null>(null);

    const [filterByConfirmed, setFilterByConfirmed] = React.useState(false);
    const filterModel: GridFilterModel = filterByConfirmed ? {
        items: [
            { field: "confirmed", operator: "is", value: "true" }
        ]
    } : { items: [] };

    const columnVisibilityModel: GridColumnVisibilityModel = {
        "confirmed": false
    };

    // We use this fetcher to submit bids, and then
    // we use an effect to listen for the response we get back
    const bidFetcher = useFetcher<SerializedBidUpdateResult>();
    React.useEffect(() => {
        if (bidFetcher.state === "idle" && bidFetcher.data) {
            if (true === bidFetcher.data.success) {
                const newBid = bidFetcher.data.bid;
                setCurrentBids(oldBids => oldBids.concat(newBid));
                setRows(() => createBidEditorDataSource({
                    event,
                    categoryHash: categoryHash.current,
                    bids
                }));
                setSnackbar({ children: "Bid confirmed", severity: "success" });
            } else if (bidFetcher.data.concluded) {
                setAuctionConcludedModalOpen(true);
            } else {
                setSnackbar({ children: bidFetcher.data.error, severity: "success" });
            }
        }
    }, [bidFetcher]);

    const onRowEditStop: GridEventListener<'rowEditStop'> = function (params, event) {
        if (params.reason === GridRowEditStopReasons.rowFocusOut) {
            event.defaultMuiPrevented = true;
        }
    };

    const onBidConfirm = async function (bid: BidEditorDataSourceItem): Promise<void> {
        try {
            if (!bid.confirmed) {
                // We will process the result of this submission
                // in the "useEffect" that listens to this "bidFetcher"
                bidFetcher.submit(bid as any, {
                    method: "POST",
                    action: `/events/${event.id}/bids/update`
                });
            }
        } catch (error) {
            console.log(error);
            console.log("Error confirming bid: ", error);
        }
    };

    const onCloseSnackbar = function () {
        setSnackbar(null);
    };

    const columns: GridColDef<BidEditorDataSourceItem>[] = [
        {
            field: "id",
            headerName: "",
            type: "string",
            editable: false,
            sortable: true
        },

        {
            field: "itemTagNumber",
            headerName: "Tag number",
            type: "string",
            editable: false,
            sortable: false
        },
        {
            field: "itemDescription",
            headerName: "Item description",
            type: "string",
            editable: false,
            flex: 1
        },
        {
            field: "minimumBid",
            headerName: "Minimum bid",
            type: "number",
            editable: false,
            align: "left",
            valueFormatter: (_, row) => MoneyFormatter.getFormattedMoney({
                amount: row.minimumBid,
                emptyPlaceholder: ""
            })
        },
        {
            field: "confirmed",
            headerName: "Confirmed",
            type: "boolean"
        },
        {
            field: "actions",
            headerName: "",
            type: "actions",
            getActions: (params: GridRowParams<BidEditorDataSourceItem>) => createBidConfirmButton({
                params,
                onClick: async () => await onBidConfirm(params.row)
            }),
            valueGetter: (_, row) => row.confirmed
        },
        {
            field: "bidAmount",
            headerName: "Current bid",
            editable: true,
            type: "number",
            align: "left",
            valueFormatter: (_, row) => MoneyFormatter.getFormattedMoney({
                amount: row.bidAmount,
                emptyPlaceholder: ""
            })
        },
    ]

    return (
        <>
            <StandardOkModal
                open={auctionConcludedModalOpen}
                title="This auction has concluded"
                description={"The bid you just made was not submitted "
                    + "because this auction event is now over. Sorry! "
                    + "You may now close this browser window/tab."}
                onOk={() => setAuctionConcludedModalOpen(false)}
                onClose={() => setAuctionConcludedModalOpen(false)}
            />
            <StyledBox>
                <Stack
                    spacing={2}
                    sx={(theme) => ({
                        "& .confirmed": {
                            backgroundColor: (theme.palette.mode === "dark"
                                ? theme.palette.success.dark
                                : theme.palette.success.light) + "!important"
                        }
                    })}
                >
                    <Stack
                        spacing={2}
                        direction="row"
                    >
                        <Typography
                            variant={"h4"}
                            gutterBottom
                        >{"Bids"}</Typography>
                        <Typography
                            align="right"
                            flex={1}
                            variant={"h4"}
                            gutterBottom
                        >{"Confirmed bid total: " + getConfirmedBidTotal({
                            dataSource: rows,
                            asFormattedString: true
                        })}</Typography>
                    </Stack>
                    <Alert
                        severity="warning"
                        sx={{ fontWeight: "bold" }}
                    >NOTE: Once confirmed, all bids are final.</Alert>
                    <DataGrid
                        filterModel={filterModel}
                        disableColumnFilter
                        disableColumnSelector
                        disableDensitySelector
                        columns={columns}
                        columnVisibilityModel={columnVisibilityModel}
                        rows={rows}
                        getRowClassName={getRowClassName}
                        onRowEditStop={onRowEditStop}
                        isCellEditable={(params) => !params.row.confirmed}
                        slots={{ toolbar: QuickSearchToolbar }}
                        slotProps={{
                            toolbar: {
                                withFilterCheckboxes: [{
                                    value: filterByConfirmed,
                                    checked: filterByConfirmed,
                                    label: "Show confirmed only",
                                    onInput: () => {
                                        console.log("Changing filter model...")
                                        setFilterByConfirmed((oldValue) => !oldValue);
                                    }
                                }] satisfies QuickSearchFilterCheckbox[]
                            }
                        }}
                    />
                </Stack>
            </StyledBox>
            {
                !!snackbar &&
                <StandardSnackbar
                    onClose={onCloseSnackbar}
                >
                    <StandardAlert {...snackbar} onClose={onCloseSnackbar} />
                </StandardSnackbar>
            }
        </>
    );
}