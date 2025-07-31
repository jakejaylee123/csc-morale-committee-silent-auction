import { 
    useEffect,
    useRef,
    useState
} from "react";
import { useFetcher } from "react-router";

import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

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

import { Bid, CategoryCode } from "@prisma/client";

import { ItemTagNumberGenerator, ItemTagNumberSorter } from "~/commons/item.common";
import { BasicDto, Dto, MoneyFormatter } from "~/commons/general.common";
import { CategoryCommon } from "~/commons/category.common";
import { EventWithConvenience } from "~/services/event.server";
import { CategoryHash } from "~/services/category.server";
import { BidWithItemAndBidder, BidWithJustId } from "~/services/bid.server";

import { StyledBox } from "./StyledBox";
import { GridQuickSearchToolbar } from "./GridQuickSearchToolbar";
import { StandardSnackbar, StandardSnackbarProps } from "./StandardSnackbar";
import { AdminEventBidDisqualifyResult } from "~/routes/admin.events.$id.bids.disqualify";

export type AdminBidEditorProps = {
    event: Dto<EventWithConvenience>,
    categories: Dto<CategoryCode>[],
    bids: Dto<BidWithItemAndBidder>[]
};

type AdminBidEditorDataSourceArgs = {
    categoryHash: CategoryHash,
    bids: Dto<BidWithItemAndBidder>[]
};
type AdminBidEditorDataSourceItem = {
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

function createAdminBidEditorDataSource({ categoryHash, bids }: AdminBidEditorDataSourceArgs) {
    const generator = new ItemTagNumberGenerator(categoryHash);
    const sorter = new ItemTagNumberSorter(categoryHash);

    const precursor = bids.map(bid => ({
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
        minimumBid: bid?.item?.minimumBid || undefined,
        bidAmount: bid.bidAmount,
        disqualified: bid.disqualified || bid.item.disqualified
    }));
    
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
    const categoryHash = useRef(CategoryCommon.convertCategoryArrayToHash(categories));
    const [currentBids, _] = useState(bids || []);
    
    const [rows, setRows] = useState<AdminBidEditorDataSource>(createAdminBidEditorDataSource({
        categoryHash: categoryHash.current,
        bids: currentBids
    }));
    useEffect(() => {
        setRows(() => createAdminBidEditorDataSource({
            categoryHash: categoryHash.current,
            bids: currentBids
        }));
    }, [currentBids]);

    const [snackbar, setSnackbar] = useState<StandardSnackbarProps | null>(null);
    const columnVisibilityModel: GridColumnVisibilityModel = {
        "disqualified": false
    };

    // We use this fetcher to submit bids, and then
    // we use an effect to listen for the response we get back
    const bidDisqualifyFetcher = useFetcher<AdminEventBidDisqualifyResult>();
    useEffect(() => {
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

    const onRowEditStop: GridEventListener<"rowEditStop"> = function (params, event) {
        if (params.reason === GridRowEditStopReasons.rowFocusOut) {
            event.defaultMuiPrevented = true;
        }
    };

    const onBidDisqualify = async function (bid: AdminBidEditorDataSourceItem): Promise<void> {
        try {
            if (!bid.disqualified) {
                const bidToDisqualify: BasicDto<BidWithJustId> = {
                    id: bid.bidId
                };

                bidDisqualifyFetcher.submit(bidToDisqualify, {
                    method: "POST",
                    action: `/admin/events/${event.id}/bids/disqualify`,
                    encType: "application/json"
                });
            }
        } catch (error) {
            console.log("Error submitting request to confirm bid: ", error);
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
            <Stack 
                spacing={2}
                sx={{
                    marginBottom: 75
                }}>
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
                            showToolbar
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
            </Stack>
        </>
    );
}