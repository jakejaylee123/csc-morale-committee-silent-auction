import * as React from "react";
import { useFetcher } from "@remix-run/react";

import {
    Alert,
    Button,
    Stack,
    Typography 
} from "@mui/material";

import { 
    DataGrid, 
    GridActionsCellItemProps, 
    GridColDef, 
    GridColumnVisibilityModel, 
    GridEventListener, 
    GridFilterModel, 
    GridRowClassNameParams, 
    GridRowEditStopReasons, 
    GridRowParams, 
    ToolbarPropsOverrides
} from "@mui/x-data-grid";

import { CategoryHash, SerializedCategoryCode } from "~/services/category.server";
import { SerializedBid } from "~/services/bid.server";
import { SerializedEventWithItems } from "~/services/event.server";

import { ItemTagNumberGenerator, ItemTagNumberSorter } from "~/commons/item.common";
import { MoneyFormatter } from "~/commons/general.common";
import { CategoryCommon } from "~/commons/category.common";

import { SerializedBidUpdateResult } from "~/routes/events.$id.bids.update";

import { StyledBox } from "./StyledBox";
import { GridQuickSearchFilterCheckbox, GridQuickSearchToolbar, GridQuickSearchFilterCheckboxStates, GridQuickSearchToolbarProps } from "./GridQuickSearchToolbar";
import { StandardSnackbar, StandardSnackbarProps } from "./StandardSnackbar";
import { StandardOkModal } from "./StandardModal";
import { GridToolbarProps } from "@mui/x-data-grid/internals";

const FILTER_ID_CONFIRMED_BIDS = "confirmed-bids-filter";

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
    confirming: boolean,
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
    const sorter = new ItemTagNumberSorter(categoryHash);

    const precursor = event.items.map(item => {
        const currentBid = bids.find(bid => bid.itemId === item.id);
        const minimumBid = item.minimumBid
            ? parseFloat(item.minimumBid) : undefined;
        const bidAmount = currentBid?.bidAmount
            ? parseFloat(currentBid.bidAmount) : undefined;

        return {
            itemId: item.id,
            categoryId: item.categoryId,
            categoryPrefix: categoryHash[item.categoryId].prefix,
            itemNumber: item.itemNumber,
            itemTagNumber: generator.getItemTagNumber({
                categoryId: item.categoryId,
                itemNumber: item.itemNumber
            }),
            itemDescription: item.itemDescription,
            minimumBid,
            confirmed: !!currentBid,
            confirming: false,
            bidAmount
        };
    });
    
    const sortedPrecursor = sorter.getSortedItems(precursor);
    return sortedPrecursor.map((item, index) => ({
        ...item,
        id: index + 1
    } satisfies BidEditorDataSourceItem));
}

const createBidConfirmButton: BidConfirmButtonCreator = function ({ params, onClick }) {
    const variant = params.row.confirmed ? undefined : "contained";
    const disabled = params.row.confirmed || params.row.confirming;
    const text = params.row.confirmed ? "Confirmed" 
        : params.row.confirming ? "Confirming..." : "Confirm";

    return [(
        <Button
            color="primary"
            variant={variant}
            disabled={disabled}
            onClick={onClick}
        >{text}</Button>
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
        amount: sum,
        emptyPlaceholder: "$0.00"
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
    React.useEffect(() => {
        setRows(() => createBidEditorDataSource({
            event,
            categoryHash: categoryHash.current,
            bids: currentBids
        }));
    }, [currentBids]);

    const [snackbar, setSnackbar] = React.useState<StandardSnackbarProps | null>(null);

    const checkboxFilterStatesRef = React.useRef<GridQuickSearchFilterCheckboxStates>({
        [FILTER_ID_CONFIRMED_BIDS]: {
            apply: false,
            filter: { 
                id: FILTER_ID_CONFIRMED_BIDS,
                field: "confirmed", 
                operator: "is", 
                value: "true",
                label: "Show confirmed only"
            }
        }
    });
    const [filterModel, setFilterModel] = React.useState<GridFilterModel>({
        items: []
    });
    const onFilterModelChange = function (model?: GridFilterModel) {
        const states = Object.values(checkboxFilterStatesRef.current);
        const stateIds = Object.keys(checkboxFilterStatesRef.current);

        model = model || filterModel;
        setFilterModel({
            ...model,
            items: [
                ...model.items
                    .filter(item => typeof item.id !== "string"
                        || !stateIds.includes(item.id || "")),
                ...(states.flatMap(value => value.apply 
                    ? [value.filter] 
                    : []))
            ]
        });
    };

    const columnVisibilityModel: GridColumnVisibilityModel = {
        "confirmed": false
    };

    // We use this fetcher to submit bids, and then
    // we use an effect to listen for the response we get back
    const bidFetcher = useFetcher<SerializedBidUpdateResult>();
    React.useEffect(() => {
        if (bidFetcher.state !== "idle" && bidFetcher.data) {
            console.log("Bid fetcher data: ", bidFetcher.data);
            if (true === bidFetcher.data.success) {
                const newBid = bidFetcher.data.bid;
                setCurrentBids(oldBids => oldBids.concat(newBid));

                setSnackbar({ alerts: [{ message: "Bid confirmed", severity: "success" }] });
            } else if (bidFetcher.data.concluded) {
                setAuctionConcludedModalOpen(true);
            } else {
                setCurrentBids(oldBids => oldBids);

                setSnackbar({ alerts: [{ message: bidFetcher.data.error, severity: "error" }] });
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
            if (bid.confirmed) {
                setSnackbar({ alerts: [{ message: "This bid is already confirmed.", severity: "error" }] });
            } else if ((bid.bidAmount || 0) <= 0) {
                setSnackbar({ alerts: [{ message: "Bid must be greater than $0.00", severity: "error" }] });
            } else {
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
            <Stack alignContent="center">
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
                            onFilterModelChange={onFilterModelChange}
                            disableColumnFilter
                            disableColumnSelector
                            disableDensitySelector
                            columns={columns}
                            columnVisibilityModel={columnVisibilityModel}
                            rows={rows}
                            getRowClassName={getRowClassName}
                            onRowEditStop={onRowEditStop}
                            isCellEditable={(params) => !params.row.confirmed}
                            slots={{ toolbar: GridQuickSearchToolbar }}
                            slotProps={{
                                toolbar: {
                                    withFilterCheckboxes: Object.values(checkboxFilterStatesRef.current)
                                        .map(state => ({
                                            id: state.filter.id,
                                            value: state.apply,
                                            checked: state.apply,
                                            label: state.filter.label,
                                            onInput: () => {
                                                state.apply = !state.apply
                                                onFilterModelChange();
                                            }
                                        } satisfies GridQuickSearchFilterCheckbox))
                                } as GridQuickSearchToolbarProps
                            }}
                        />
                    </Stack>
                </StyledBox>
            </Stack>
            {
                !!snackbar &&
                <StandardSnackbar
                    {...snackbar}
                    onClose={onCloseSnackbar}
                />
            }
        </>
    );
}