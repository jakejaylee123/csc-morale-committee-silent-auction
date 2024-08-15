import * as React from "react";
import { Form } from "@remix-run/react";

import { DateTime } from "luxon";

import { SerializedNullableEventWithItems } from "~/services/event.server";
import { Button, ButtonGroup, Checkbox, FormControlLabel, Stack, TextField, Typography } from "@mui/material";
import { Create, Save } from "@mui/icons-material";
import { DateTimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterLuxon } from "@mui/x-date-pickers/AdapterLuxon";

import { StyledBox } from "./StyledBox";
import { SerializedCategoryCode } from "~/services/category.server";
import { EventItemsEditor } from "./EventItemsEditor";

export interface EventEditorProps {
    event: SerializedNullableEventWithItems,
    categories: SerializedCategoryCode[]
};

type NullableDateTime = DateTime<true> | DateTime<false> | null;

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
    const [releaseWinners, setReleaseWinners] = React.useState(isNew ? false : event.releaseWinners)
    const [startDate, setStartDate] = React
        .useState<NullableDateTime>(isNew ? DateTime.now() : DateTime.fromISO(event.startsAt));
    const [endDate, setEndDate] = React
        .useState<NullableDateTime>(isNew ? DateTime.now().plus({ hours: 1 }) : DateTime.fromISO(event.endsAt));

    return (
        <>
            <LocalizationProvider dateAdapter={AdapterLuxon}>
                <Stack spacing={2}>
                    <StyledBox>
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
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            name="releaseWinners"
                                            value={releaseWinners}
                                            checked={releaseWinners}
                                            onChange={(_, newValue) => setReleaseWinners(newValue)}
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
                    {
                        event.id !== 0 &&
                        <EventItemsEditor
                            event={event}
                            categories={categories}
                        />
                    }
                </Stack>
            </LocalizationProvider>
        </>
    );
}