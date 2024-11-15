import * as React from "react";
import { useFetcher } from "@remix-run/react";

import {
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
    GridRowClassNameParams, 
    GridRowEditStopReasons, 
    GridRowParams 
} from "@mui/x-data-grid";

import { ItemTagNumberGenerator, ItemTagNumberSorter } from "~/commons/item.common";
import { MoneyFormatter } from "~/commons/general.common";
import { CategoryCommon } from "~/commons/category.common";
import { SerializedAdminEventBidDisqualifyResult } from "~/routes/admin.events.$id.bids.disqualify";
import { SerializedEvent } from "~/services/event.server";
import { CategoryHash, SerializedCategoryCode } from "~/services/category.server";
import { SerializedBidWithItemAndBidder } from "~/services/bid.server";

import { StyledBox } from "./StyledBox";
import { GridQuickSearchToolbar } from "./GridQuickSearchToolbar";
import { StandardSnackbar, StandardSnackbarProps } from "./StandardSnackbar";

export interface AdminBidEditorProps {
    event: SerializedEvent,
    categories: SerializedCategoryCode[],
    bids: SerializedBidWithItemAndBidder[]
}

interface AdminBidEditorDataSourceArgs {
    event: SerializedEvent,
    categoryHash: CategoryHash,
    bids: SerializedBidWithItemAndBidder[]
};
interface AdminBidEditorDataSourceItem {
    // This ID is only used for the DataGridView we're using
    id: number

    bidId: number,
    itemId: number,
    categoryPrefix: string,
    itemNumber: number,
    itemTagNumber: string,
    itemDescription: string,
    minimumBid?: number,
    bidAmount: number,
    disqualified: boolean
};
type AdminBidEditorDataSource = AdminBidEditorDataSourceItem[];

type BidConfirmButtonCreatorArgs = {
    params: GridRowParams<AdminBidEditorDataSourceItem>,
    onClick?: React.MouseEventHandler<HTMLButtonElement>
};
type BidConfirmButtonCreator = (
    args: BidConfirmButtonCreatorArgs
) => readonly React.ReactElement<GridActionsCellItemProps>[];

type GetConfirmedBidTotalArgs = {
    dataSource: AdminBidEditorDataSource
    asFormattedString?: boolean
};

function createAdminBidEditorDataSource({ categoryHash, bids }: AdminBidEditorDataSourceArgs) {
    const generator = new ItemTagNumberGenerator(categoryHash);
    const sorter = new ItemTagNumberSorter(categoryHash);

    const precursor = bids.map(bid => {
        const minimumBid = bid.item.minimumBid
            ? parseFloat(bid.item.minimumBid) : undefined;
        const bidAmount = parseFloat(bid.bidAmount);

        return {
            bidId: bid.id,
            itemId: bid.item.id,
            categoryId: bid.item.categoryId,
            categoryPrefix: categoryHash[bid.item.categoryId].prefix,
            itemNumber: bid.item.itemNumber,
            bidderName: `${bid.bidder.lastName}, ${bid.bidder.firstName}`,
            itemTagNumber: generator.getItemTagNumber({
                categoryId: bid.item.categoryId,
                itemNumber: bid.item.itemNumber
            }),
            itemDescription: bid.item.itemDescription,
            minimumBid,
            bidAmount,
            disqualified: bid.disqualified || bid.item.disqualified
        };
    });
    
    const sortedPrecursor = sorter.getSortedItems(precursor);
    return sortedPrecursor.map((item, index) => ({
        ...item,
        id: index + 1
    } satisfies AdminBidEditorDataSourceItem));
}

const createBidConfirmButton: BidConfirmButtonCreator = function ({ params, onClick }) {
    return [(
        <Button
            color="primary"
            variant={(params.row.disqualified) ? undefined : "contained"}
            disabled={params.row.disqualified}
            onClick={onClick}
        >{params.row.disqualified ? "Disqualified" : "Disqualify"}</Button>
    )];
};

const getRowClassName = function (params: GridRowClassNameParams<AdminBidEditorDataSourceItem>): string {
    return params.row.disqualified ? "disqualified" : "";
}

export function AdminBidEditor({ event, categories, bids }: AdminBidEditorProps) {
    const categoryHash = React.useRef(CategoryCommon.convertCategoryArrayToHash(categories));
    const [currentBids, setCurrentBids] = React.useState(bids || []);
    
    const [rows, setRows] = React.useState<AdminBidEditorDataSource>(createAdminBidEditorDataSource({
        event,
        categoryHash: categoryHash.current,
        bids: currentBids
    }));
    React.useEffect(() => {
        setRows(() => createAdminBidEditorDataSource({
            event,
            categoryHash: categoryHash.current,
            bids: currentBids
        }));
    }, [currentBids]);

    const [snackbar, setSnackbar] = React.useState<StandardSnackbarProps | null>(null);
    const columnVisibilityModel: GridColumnVisibilityModel = {
        "disqualified": false
    };

    // We use this fetcher to submit bids, and then
    // we use an effect to listen for the response we get back
    const bidDisqualifyFetcher = useFetcher<SerializedAdminEventBidDisqualifyResult>();
    React.useEffect(() => {
        if (bidDisqualifyFetcher.state === "idle" && bidDisqualifyFetcher.data) {
            if (true === bidDisqualifyFetcher.data.success) {
                const updatedBid = bidDisqualifyFetcher.data.bid;
                const oldRow = rows.find(row => row.bidId === updatedBid.id);
                if (oldRow) {
                    oldRow.disqualified = true;
                    setRows(rows);
                }
                setSnackbar({ alerts: [{ message: "Bid disqualified", severity: "success" }] });
            } else {
                setSnackbar({ alerts: [{ message: bidDisqualifyFetcher.data.error, severity: "error" }] });
            }
        }
    }, [bidDisqualifyFetcher]);

    const onRowEditStop: GridEventListener<'rowEditStop'> = function (params, event) {
        if (params.reason === GridRowEditStopReasons.rowFocusOut) {
            event.defaultMuiPrevented = true;
        }
    };

    const onBidDisqualify = async function (bid: AdminBidEditorDataSourceItem): Promise<void> {
        try {
            if (!bid.disqualified) {
                // We will process the result of this submission
                // in the "useEffect" that listens to this "bidFetcher"
                bidDisqualifyFetcher.submit(bid as any, {
                    method: "POST",
                    action: `/admin/events/${event.id}/bids/disqualify`
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

    const columns: GridColDef<AdminBidEditorDataSourceItem>[] = [
        {
            field: "id",
            headerName: "",
            type: "string",
            editable: false,
            sortable: true
        },
        {
            field: "bidderName",
            headerName: "Bidder",
            type: "string",
            editable: false,
            sortable: true,
            filterable: true,
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
            field: "disqualified",
            headerName: "Disqualified",
            type: "boolean"
        },
        {
            field: "actions",
            headerName: "",
            type: "actions",
            getActions: (params: GridRowParams<AdminBidEditorDataSourceItem>) => createBidConfirmButton({
                params,
                onClick: async () => await onBidDisqualify(params.row)
            }),
            valueGetter: (_, row) => row.disqualified
        },
        {
            field: "bidAmount",
            headerName: "Current bid",
            editable: false,
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
            <StyledBox>
                <Stack
                    spacing={2}
                    sx={(theme) => ({
                        "& .disqualified": {
                            backgroundColor: (theme.palette.mode === "dark"
                                ? theme.palette.error.dark
                                : theme.palette.error.light) + "!important"
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
                    </Stack>
                    <DataGrid
                        disableColumnFilter
                        disableColumnSelector
                        disableDensitySelector
                        columns={columns}
                        columnVisibilityModel={columnVisibilityModel}
                        rows={rows}
                        getRowClassName={getRowClassName}
                        onRowEditStop={onRowEditStop}
                        isCellEditable={(params) => !params.row.disqualified}
                        slots={{ toolbar: GridQuickSearchToolbar }}
                    />
                </Stack>
            </StyledBox>
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