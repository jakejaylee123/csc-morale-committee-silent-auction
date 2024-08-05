import * as React from "react";
import { Form } from "@remix-run/react";

import { DateTime } from "luxon";

import { SerializedItem, SerializedNullableEventWithItems } from "~/services/event.server";
import { Button, ButtonGroup, Checkbox, Fade, FormControlLabel, Stack, TextField, Typography } from "@mui/material";
import { Create, Save, UploadFile } from "@mui/icons-material";
import { DateTimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterLuxon } from "@mui/x-date-pickers/AdapterLuxon";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

import { StyledBox } from "./StyledBox";
import { FileUploadModal } from "./FileUploadModal";

export interface ItemsEditorProps {
    event: SerializedNullableEventWithItems
}
export interface EventEditorProps {
    event: SerializedNullableEventWithItems
};

type NullableDateTime = DateTime<true> | DateTime<false> | null;

function ItemsEditor({ event }: ItemsEditorProps) {
    if (!event) {
        return (
            <StyledBox id="image">
                <Typography variant={"h5"} gutterBottom>{"Save your new event before adding items."}</Typography>
            </StyledBox>
        );
    }

    const [uploadCsvModalOpen, setUploadCsvModalOpen] = React.useState(false);

    const rows: SerializedItem[] = event?.items || [];
    const columns: GridColDef<SerializedItem>[] = [
        {
            field: 'id',
            headerName: 'Internal ID',
            width: 150,
            editable: false
        },
        {
            field: 'itemNumber',
            headerName: 'Item number',
            width: 150,
            editable: true
        },
        {
            field: 'categoryId',
            headerName: 'Category ID',
            width: 150,
            editable: true
        },
        {
            field: 'itemDescription',
            headerName: 'Description',
            width: 150,
            editable: true
        },
        {
            field: 'minimumBid',
            headerName: 'Minimum bid',
            width: 150,
            editable: true
        },
        {
            field: 'createdAt',
            headerName: 'Created at',
            width: 150,
            editable: true
        },
        {
            field: 'updatedAt',
            headerName: 'Updated at',
            width: 150,
            editable: true
        }
    ];

    return (
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
                    disableRowSelectionOnClick
                />
            </Stack>
        </StyledBox>
    );
}

export function EventEditor({ event }: EventEditorProps) {
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

                    <ItemsEditor event={event} />
                </Stack>
            </LocalizationProvider>
        </>
    );
}