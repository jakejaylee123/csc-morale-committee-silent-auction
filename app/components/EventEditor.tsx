import * as React from "react";
import { Form, useFetcher } from "@remix-run/react";

import { DateTime } from "luxon";

import { SerializedItem, SerializedNullableEventWithItems } from "~/services/event.server";
import { Alert, AlertProps, Button, ButtonGroup, Checkbox, FormControlLabel, Snackbar, Stack, TextField, Typography } from "@mui/material";
import { Create, Delete, Save, UploadFile } from "@mui/icons-material";
import { DateTimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterLuxon } from "@mui/x-date-pickers/AdapterLuxon";
import { DataGrid, GridActionsCellItem, GridColDef, GridEventListener, GridRowEditStopReasons, GridRowId, GridRowModes, GridRowModesModel, GridRowParams, GridRowsProp, GridSlots, GridToolbarContainer } from "@mui/x-data-grid";

import { StyledBox } from "./StyledBox";
import { FileUploadModal } from "./FileUploadModal";
import { SerializedCategoryCode } from "~/services/category.server";
import { SerializedUncreatedItem } from "~/services/item.server";
import { SerializedEventItemUpdateResult } from "~/routes/admin.events.$id.items.update";
import { SerializedEventItemDeleteResult } from "~/routes/admin.events.$id.items.delete";

export interface ItemsEditorToolbarProps {
    event: SerializedNullableEventWithItems,
    categories: SerializedCategoryCode[]
    setRows: (newRows: (oldRows: GridRowsProp) => GridRowsProp) => void;
    setRowModesModel: (
        newModel: (oldModel: GridRowModesModel) => GridRowModesModel,
    ) => void;
}
export interface ItemsEditorProps {
    event: SerializedNullableEventWithItems,
    categories: SerializedCategoryCode[]
}
export interface EventEditorProps {
    event: SerializedNullableEventWithItems,
    categories: SerializedCategoryCode[]
};

type NullableDateTime = DateTime<true> | DateTime<false> | null;

function ItemsEditorToolbar({ event, categories, setRows, setRowModesModel }: ItemsEditorToolbarProps) {
    const [state, setState] = React.useState<"add" | "view">("view");

    const onAdd = () => {
        const newItem = {
            id: "new",
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
        } satisfies SerializedUncreatedItem;

        setRows((oldRows) => [
            newItem,
            ...oldRows
        ]);

        setRowModesModel((oldModel) => ({
            ...oldModel,
            [newItem.id]: {
                mode: GridRowModes.Edit,
                fieldToFocus: 'description'
            },
        }));

        setState("add");
    };

    const onSave = () => {
        setRowModesModel((model) => ({ ...model, ["new"]: { mode: GridRowModes.View } }));
        setState("view");
    };

    const onCancel = () => {
        setRows((oldRows) => oldRows.filter(row => row.id !== "new"));

        setRowModesModel((oldModel) => {
            delete oldModel["new"];
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

function ItemsEditor({ event, categories }: ItemsEditorProps) {
    if (!event) {
        return (
            <StyledBox id="image">
                <Typography variant={"h5"} gutterBottom>{"Save your new event before adding items."}</Typography>
            </StyledBox>
        );
    }

    const [uploadCsvModalOpen, setUploadCsvModalOpen] = React.useState(false);
    const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>({});
    const [rows, setRows] = React.useState<SerializedItem[]>(event?.items || []);
    const [snackbar, setSnackbar] = React.useState<Pick<
        AlertProps,
        'children' | 'severity'
    > | null>(null);

    // We use this fetcher to send requests to update/create items, and then
    // we use an effect to listen for the response we get back
    const itemFetcher = useFetcher<SerializedEventItemUpdateResult>();
    React.useEffect(() => {
        if (itemFetcher.state === "idle" && itemFetcher.data) {
            if (itemFetcher.data.success) {
                setRows(rows
                    .filter(row => (row.id as any) !== "new")
                    .concat(itemFetcher.data.items[0]));

                setSnackbar({ children: 'User successfully saved', severity: 'success' });
            } else {
                throw new Error(itemFetcher.data.errors
                    .flatMap(error => error.messages)
                    .map(message => `- ${message}`)
                    .join("\r\n"));
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
                setRows(rows.filter(row => row.id !== deleteData.deletedItemId));

                setSnackbar({ children: 'Item successfully removed', severity: 'success' });
            } else {
                throw new Error(deleteData.errors
                    .map(message => `- ${message}`)
                    .join("\r\n"));
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
        if (params.reason === GridRowEditStopReasons.rowFocusOut) {
            event.defaultMuiPrevented = true;
        }
    };

    const onRowUpdate = async function (newItem: SerializedItem, oldItem: SerializedItem) {
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
        setSnackbar({ children: error.message, severity: 'error' });
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
            valueOptions: categories.map(category => category.id),
            getOptionLabel: (value) => categories
                .find(category => category.id === value)?.description || "(None)",
            valueFormatter: (value) => categories.find(category => category.id === value)!.description,
            valueSetter: (value, row) => {
                row.categoryId = value;
                return row;
            }
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
            <StyledBox id="image">
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
                            toolbar: ItemsEditorToolbar as GridSlots["toolbar"]
                        }}
                        slotProps={{
                            toolbar: { event, categories, setRows, setRowModesModel },
                        }}
                    />
                </Stack>
            </StyledBox>
            {
                !!snackbar &&
                <Snackbar
                    open
                    onClose={onCloseSnackbar}
                    autoHideDuration={6000}
                >
                    <Alert {...snackbar} onClose={onCloseSnackbar} />
                </Snackbar>
            }
        </>
    );
}

export function EventEditor({ event, categories }: EventEditorProps) {
    const found = event !== null;
    if (!found) {
        return (
            <Typography variant={"h5"} gutterBottom>This auction event does not exist.</Typography>
        );
    }

    const isNew = event.id === 0;
    const [description, setDescription] = React.useState(isNew ? "" : event.description);
    const [enabled, setEnabled] = React.useState(isNew ? true : event.enabled);
    const [startDate, setStartDate] = React
        .useState<NullableDateTime>(isNew ? DateTime.now() : DateTime.fromISO(event.startsAt));
    const [endDate, setEndDate] = React
        .useState<NullableDateTime>(isNew ? DateTime.now().plus({ hours: 1 }) : DateTime.fromISO(event.startsAt));

    return (
        <>
            <LocalizationProvider dateAdapter={AdapterLuxon}>
                <Stack spacing={2}>
                    <StyledBox id="image">
                        <Typography variant={"h4"} gutterBottom>{"Main properties"}</Typography>
                        <Form
                            method="post"
                            action={`/admin/events/${isNew ? "new" : event.id}/edit`}
                        >
                            <Stack spacing={2}>
                                <TextField
                                    required
                                    label="Description"
                                    name="description"
                                    helperText="Can be used to describe or give a name to the auction event."
                                    multiline
                                    value={description}
                                    onChange={(event) => setDescription(event.target.value)}
                                />
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            name="enabled"
                                            value={enabled}
                                            checked={enabled}
                                            onChange={(_, newValue) => setEnabled(newValue)}
                                        />
                                    }
                                    label="Enabled"
                                />
                                <DateTimePicker
                                    label="Start date"
                                    name="startDate"
                                    value={startDate}
                                    onChange={(newValue) => setStartDate(newValue)}
                                />
                                <DateTimePicker
                                    label="End date"
                                    name="endDate"
                                    value={endDate}
                                    onChange={(newValue => setEndDate(newValue))}
                                />
                                <ButtonGroup fullWidth>
                                    <Button
                                        startIcon={isNew ? <Create /> : <Save />}
                                        color="primary"
                                        type="submit"
                                    >{isNew ? "Create" : "Save"}</Button>
                                </ButtonGroup>
                            </Stack>
                        </Form>
                    </StyledBox>

                    <ItemsEditor
                        event={event}
                        categories={categories}
                    />
                </Stack>
            </LocalizationProvider>
        </>
    );
}