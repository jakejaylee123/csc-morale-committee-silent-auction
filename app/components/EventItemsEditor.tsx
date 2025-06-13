import * as React from "react";
import { FetcherWithComponents, useFetcher } from "@remix-run/react";

import { DateTime } from "luxon";

import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Tooltip from "@mui/material/Tooltip";
import Popper from "@mui/material/Popper";
import TextField from "@mui/material/TextField";
import Paper from "@mui/material/Paper";
import InputLabel from "@mui/material/InputLabel";

import UploadFile from "@mui/icons-material/UploadFile";
import Delete from "@mui/icons-material/Delete";
import Add from "@mui/icons-material/Add";

import {
    DataGrid,
    GridActionsCellItem,
    GridColDef,
    GridEventListener,
    GridRowEditStopReasons,
    GridRowId,
    GridRowModes,
    GridRowModesModel,
    GridRowParams,
    Toolbar,
    ToolbarButton
} from "@mui/x-data-grid";

import { SerializedItem, SerializedNullableEventWithItems } from "~/services/event.server";
import { SerializedCategoryCode } from "~/services/category.server";
import { SerializedEventItemUpdateResult } from "~/routes/admin.events.$id.items.update";
import { SerializedEventItemDeleteResult } from "~/routes/admin.events.$id.items.delete";
import { MoneyFormatter } from "~/commons/general.common";

import { StyledBox } from "./StyledBox";
import { FileUploadModal } from "./FileUploadModal";
import { StandardSnackbar, StandardSnackbarProps } from "./StandardSnackbar";

export interface EventItemsEditorToolbarProps {
    event: SerializedNullableEventWithItems,
    categories: SerializedCategoryCode[],
    itemFetcher: FetcherWithComponents<SerializedEventItemUpdateResult>
}
export interface EventItemsEditorProps {
    event: SerializedNullableEventWithItems,
    categories: SerializedCategoryCode[]
}

function EventItemsEditorToolbar({
    event,
    categories,
    itemFetcher
}: EventItemsEditorToolbarProps) {
    const [newPanelOpen, setNewPanelOpen] = React.useState(false);
    const newPanelTriggerRef = React.useRef<HTMLButtonElement>(null);

    const handleClose = () => {
        setNewPanelOpen(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (event) {
            const formData = new FormData(e.target as HTMLFormElement);
            const newItem = {
                id: "new",
                eventId: event.id,
                itemNumber: Number(formData.get("itemNumber")),
                itemDescription: formData.get("itemDescription") as string,
                minimumBid: formData.get("minimumBid") as string,
                categoryId: Number(formData.get("category")),
                disqualified: false,
                disqualificationReason: "",
                createdAt: DateTime.now().toISO(),
                createdBy: 0,
                updatedAt: null,
                updatedBy: null,
                disqualifiedBy: null
            };

            itemFetcher.submit(newItem, {
                method: "POST",
                action: `/admin/events/${event.id}/items/update`
            });
        } else {
            console.error("There was no event to save this item to...");
        }

        handleClose();
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Escape') {
            handleClose();
        }
    };

    return (
        <Toolbar>
            <Tooltip title="Add new item">
                <ToolbarButton
                    ref={newPanelTriggerRef}
                    aria-describedby="new-panel"
                    label="Add item"
                    onClick={() => setNewPanelOpen((prev) => !prev)}
                >
                    <Add fontSize="small" />
                </ToolbarButton>
            </Tooltip>

            <Popper
                open={newPanelOpen}
                anchorEl={newPanelTriggerRef.current}
                placement="bottom-end"
                id="new-panel"
                onKeyDown={handleKeyDown}
            >
                <Paper
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        width: 300,
                        p: 2,
                    }}
                    elevation={8}
                >
                    <Typography fontWeight="bold">Add new item</Typography>
                    <form onSubmit={handleSubmit}>
                        <Stack spacing={2}>
                            <InputLabel id="category-label">Category</InputLabel>
                            <Select 
                                fullWidth
                                native
                                label={"Category"}
                                labelId="category-label"
                                name="category"
                                size="small"
                                MenuProps={{ disablePortal: true }}
                                required
                            >
                                {
                                    categories.map(category => (
                                        <option
                                            key={`menu-item-category-${category.id}`}
                                            id={`${category.id}`}
                                            value={category.id}
                                        >{category.description}</option>
                                    ))
                                }
                            </Select>
                            <TextField
                                label="Item number"
                                name="itemNumber"
                                size="small"
                                fullWidth
                                autoFocus
                                required
                            />
                            <TextField
                                label="Description"
                                type="text"
                                name="itemDescription"
                                size="small"
                                fullWidth
                                required
                            />
                            <TextField
                                label="Minimum bid"
                                type="number"
                                name="minimumBid"
                                size="small"
                                fullWidth
                                required
                            />
                            <Button 
                                type="submit" 
                                variant="contained" 
                                fullWidth
                            >Add item</Button>
                            <Button 
                                type="reset" 
                                variant="outlined" 
                                fullWidth 
                                onClick={handleClose}
                            >Cancel</Button>
                        </Stack>
                    </form>
                </Paper>
            </Popper>
        </Toolbar>
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
                    setRows(newRows.concat(itemFetcher.data.items));
                }

                setSnackbar({ alerts: [{ message: 'Item successfully saved', severity: 'success' }] });
            } else {
                setRows(newRows);

                setSnackbar({
                    alerts: [{
                        message: itemFetcher.data.errors
                            .flatMap(error => error.messages)
                            .map(message => `- ${message}`)
                            .join("\r\n"),
                        severity: "error"
                    }]
                });
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
                setSnackbar({
                    alerts: [{
                        message: deleteData.errors
                            .map(message => `- ${message}`)
                            .join("\r\n"),
                        severity: "error"
                    }]
                });
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
                    {
                        categories.map(category => (
                            <MenuItem
                                key={`menu-item-category-${category.id}`}
                                value={category.id}
                            >{category.description}</MenuItem>
                        ))
                    }
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
            valueFormatter: (value) => MoneyFormatter.getFormattedMoney({
                amount: parseFloat(value),
                emptyPlaceholder: "(None)"
            })
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
                        showToolbar
                        slots={{
                            toolbar: (props) => (
                                <EventItemsEditorToolbar
                                    event={event}
                                    categories={categories}
                                    itemFetcher={itemFetcher}
                                    {...props}
                                />
                            )
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