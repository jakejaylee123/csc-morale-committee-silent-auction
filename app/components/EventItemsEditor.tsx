import * as React from "react";
import { useFetcher } from "@remix-run/react";

import { DateTime } from "luxon";

import { SerializedItem, SerializedNullableEventWithItems } from "~/services/event.server";
import { Button, ButtonGroup, MenuItem, Select, Stack, Typography } from "@mui/material";
import { Delete, UploadFile } from "@mui/icons-material";
import { DataGrid, GridActionsCellItem, GridColDef, GridEventListener, GridRowEditStopReasons, GridRowId, GridRowModes, GridRowModesModel, GridRowParams, GridRowsProp, GridSlots, GridToolbarContainer, MuiBaseEvent } from "@mui/x-data-grid";

import { StyledBox } from "./StyledBox";
import { FileUploadModal } from "./FileUploadModal";
import { SerializedCategoryCode } from "~/services/category.server";
import { SerializedEventItemUpdateResult } from "~/routes/admin.events.$id.items.update";
import { SerializedEventItemDeleteResult } from "~/routes/admin.events.$id.items.delete";
import { StandardSnackbar, StandardSnackbarProps } from "./StandardSnackbar";

type GridRowsPropSetter = (
    newRows: (oldRows: GridRowsProp) => GridRowsProp
) => void;
type GridRowModesModelSetter = (
    newModel: (oldModel: GridRowModesModel) => GridRowModesModel,
) => void;

export interface EventItemsEditorToolbarProps {
    event: SerializedNullableEventWithItems,
    categories: SerializedCategoryCode[],
    setRows: GridRowsPropSetter,
    setRowModesModel: GridRowModesModelSetter
}
export interface EventItemsEditorProps {
    event: SerializedNullableEventWithItems,
    categories: SerializedCategoryCode[]
}

function EventItemsEditorToolbar({
    event,
    categories,
    setRows,
    setRowModesModel
}: EventItemsEditorToolbarProps) {
    const [state, setState] = React.useState<"add" | "view">("view");

    const onAdd = () => {
        const newItem = {
            id: 0,
            eventId: event?.id || 0,
            itemNumber: 1,
            itemDescription: "",
            minimumBid: "",
            categoryId: categories[0].id,
            disqualified: false,
            disqualificationReason: "",
            createdAt: DateTime.now().toISO(),
            createdBy: 0,
            updatedAt: null,
            updatedBy: null,
            disqualifiedBy: null
        };

        setRows((oldRows) => [
            newItem,
            ...oldRows
        ]);

        setRowModesModel((oldModel) => ({
            ...oldModel,
            [newItem.id]: {
                mode: GridRowModes.Edit,
                fieldToFocus: 'itemDescription'
            },
        }));

        setState("add");
    };

    const onSave = () => {
        setRowModesModel((model) => ({ ...model, [0]: { mode: GridRowModes.View } }));
        setState("view");
    };

    const onCancel = () => {
        setRows((oldRows) => oldRows.filter(row => row.id !== 0));

        setRowModesModel((oldModel) => {
            delete oldModel[0];
            return oldModel;
        });

        setState("view");
    };

    return (
        <GridToolbarContainer>
            <Button
                onClick={state === "view" ? onAdd : onSave}
                variant="outlined"
            >{state === 'add' ? 'Save' : 'Add'}</Button>
            {
                state === "add" &&
                <Button
                    onClick={onCancel}
                    variant="outlined"
                    sx={{ ml: 1 }}
                >Cancel</Button>
            }
        </GridToolbarContainer>
    );
}

export function EventItemsEditor({ event, categories }: EventItemsEditorProps) {
    if (!event) {
        return (
            <StyledBox>
                <Typography variant={"h5"} gutterBottom>{"Save your new event before adding items."}</Typography>
            </StyledBox>
        );
    }

    const [uploadCsvModalOpen, setUploadCsvModalOpen] = React.useState(false);
    const [rows, setRows] = React.useState<SerializedItem[]>(event?.items || []);
    const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>({});
    const [snackbar, setSnackbar] = React.useState<StandardSnackbarProps | null>(null);

    // We use this fetcher to send requests to update/create items, and then
    // we use an effect to listen for the response we get back
    const itemFetcher = useFetcher<SerializedEventItemUpdateResult>();
    React.useEffect(() => {
        if (itemFetcher.state === "idle" && itemFetcher.data) {
            const newRows = rows
                .filter((row) => row.id !== 0);

            if (itemFetcher.data.success) {
                // If there was a change in the amount of items we have,
                // then an item creation occurred rather than an update...    
                if (newRows.length < rows.length) {
                    setRows(newRows.concat(itemFetcher.data.items[0]));
                }

                setSnackbar({ alerts: [{ message: 'User successfully saved', severity: 'success' }] });
            } else {
                setRows(newRows);

                setSnackbar({ alerts: [{
                    message: itemFetcher.data.errors
                        .flatMap(error => error.messages)
                        .map(message => `- ${message}`)
                        .join("\r\n"),
                    severity: "error"
                }]});
            }
        }
    }, [itemFetcher]);

    // We use this fetcher to send requests to delete items, and then
    // we use an effect to listen for the response we get back
    const itemDeleteFetcher = useFetcher<SerializedEventItemDeleteResult>();
    React.useEffect(() => {
        if (itemDeleteFetcher.state === "idle" && itemDeleteFetcher.data) {
            const deleteData = itemDeleteFetcher.data as SerializedEventItemDeleteResult;
            if (deleteData.success) {
                setRows(rows.filter((row) => row.id !== deleteData.deletedItemId));

                setSnackbar({ alerts: [{ message: "Item successfully removed", severity: "success" }] });
            } else {
                setSnackbar({ alerts: [{
                    message: deleteData.errors
                        .map(message => `- ${message}`)
                        .join("\r\n"),
                    severity: "error"
                }]});
            }
        }
    }, [itemDeleteFetcher]);

    const onRowDelete = (id: GridRowId) => () => {
        // We will process the result of this submission
        // in the "useEffect" that listens to this "itemDeleteFetcher"
        itemDeleteFetcher.submit({ id }, {
            method: "POST",
            action: `/admin/events/${event.id}/items/delete`
        });
    };

    const onRowEditStop: GridEventListener<'rowEditStop'> = (params, event) => {
        console.log("Preventing row edit stop behavior...");
        if (params.reason === GridRowEditStopReasons.rowFocusOut) {
            event.defaultMuiPrevented = true;
        }
    };

    const onRowUpdate = function (newItem: SerializedItem, oldItem: SerializedItem) {
        try {
            // We will process the result of this submission
            // in the "useEffect" that listens to this "itemFetcher"
            itemFetcher.submit(newItem, {
                method: "POST",
                action: `/admin/events/${event.id}/items/update`
            });
            return newItem;
        } catch (error) {
            return oldItem;
        }
    };

    const onRowModesModelChange = (newRowModesModel: GridRowModesModel) => {
        setRowModesModel(newRowModesModel);
    };

    const onProcessRowUpdateError = (error: Error) => {
        setSnackbar({ alerts: [{ message: error.message, severity: 'error' }] });
    };

    const onCloseSnackbar = () => {
        setSnackbar(null);
    };

    const columns: GridColDef<SerializedItem>[] = [
        {
            field: "delete",
            headerName: "",
            type: "actions",
            getActions: ({ id }: GridRowParams<SerializedItem>) => {
                const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;
                return isInEditMode ? [] : [
                    <GridActionsCellItem
                        icon={<Delete />}
                        label="Delete"
                        color="inherit"
                        onClick={onRowDelete(id)}
                    />,
                ];
            }
        },
        {
            field: "id",
            headerName: "Internal ID",
            editable: false
        },
        {
            field: "categoryId",
            headerName: "Category ID",
            flex: 1,
            editable: true,
            type: "singleSelect",
            valueOptions: categories?.map(category => category.id) || [],
            getOptionLabel: (value) => categories
                .find(category => category.id === value)?.description || "(None)",
            valueFormatter: (value) => categories
                .find(category => category.id === value)?.description || "(None)",
            valueSetter: (value, row) => {
                row.categoryId = value;
                return row;
            },
            renderEditCell: (params) => (
                <Select
                    fullWidth
                    value={params.value.categoryId}
                    onChange={(event) => {
                        params.row.categoryId = event.target.value;
                        params.value = event.target.value;
                    }}
                >
                    {categories.map(category => <MenuItem value={category.id}>{category.description}</MenuItem>)}
                </Select>
            )
        },
        {
            field: "itemNumber",
            headerName: "Item number",
            editable: true
        },
        {
            field: "tagNumber",
            headerName: "Tag number",
            editable: false,
            valueFormatter: (_, row) => {
                const associatedCategory = categories.find(category => category.id === row.categoryId);
                return `${associatedCategory!.prefix}${row.itemNumber}`;
            }
        },
        {
            field: "itemDescription",
            headerName: "Description",
            editable: true,
            flex: 2
        },
        {
            field: "minimumBid",
            headerName: "Minimum bid",
            editable: true,
            type: "number",
            valueFormatter: (value) => {
                const parsedValue = parseFloat(value);
                return parsedValue ? new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD"
                }).format(parsedValue) : "(None)";
            }
        },
        {
            field: "disqualified",
            headerName: "Disqualified",
            editable: true,
            type: "boolean"
        },
        {
            field: "disqualificationReason",
            headerName: "Disqualification reason",
            editable: true,
            flex: 2,
            valueFormatter: (value) => value || "",
            valueSetter: (value, row) => {
                row.disqualificationReason = value || "";
                return row;
            }
        }
    ];

    return (
        <>
            <StyledBox>
                <FileUploadModal
                    event={event}
                    open={uploadCsvModalOpen}
                    title="Upload file from CSV"
                    description="Select a CSV file to upload items with."
                    onClose={() => setUploadCsvModalOpen(false)}
                />
                <Typography variant={"h4"} gutterBottom>{"Items"}</Typography>
                <Stack spacing={2}>
                    <ButtonGroup
                        fullWidth
                    >
                        <Button
                            startIcon={<UploadFile />}
                            color="primary"
                            onClick={() => setUploadCsvModalOpen(true)}
                        >Upload from CSV</Button>
                    </ButtonGroup>
                    <DataGrid
                        columns={columns}
                        rows={rows}
                        density="compact"
                        rowModesModel={rowModesModel}
                        onRowModesModelChange={onRowModesModelChange}
                        onRowEditStop={onRowEditStop}
                        processRowUpdate={onRowUpdate}
                        onProcessRowUpdateError={onProcessRowUpdateError}
                        slots={{
                            toolbar: EventItemsEditorToolbar as GridSlots["toolbar"]
                        }}
                        slotProps={{
                            toolbar: {
                                event,
                                categories,
                                setRows,
                                setRowModesModel
                            }
                        }}
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