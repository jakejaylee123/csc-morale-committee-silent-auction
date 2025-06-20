import * as React from "react";
import { Form } from "@remix-run/react";

import { DateTime } from "luxon";

import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import Stack from "@mui/material/Stack";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import FormLabel from "@mui/material/FormLabel";

import Create from "@mui/icons-material/Create";
import Save from "@mui/icons-material/Save";

import { DateTimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterLuxon } from "@mui/x-date-pickers/AdapterLuxon";

import { SerializedNullableEventWithItems } from "~/services/event.server";
import { SerializedCategoryCode } from "~/services/category.server";

import { StyledBox } from "./StyledBox";
import { EventItemsEditor } from "./EventItemsEditor";
import { VisuallyHiddenInput } from "./VisuallyHiddenInput";

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
    const [startDate, setStartDate] = React.useState<NullableDateTime>(null);
    const [endDate, setEndDate] = React.useState<NullableDateTime>(null);
    const [zoneName, setZoneName] = React.useState("");

    React.useEffect(() => {
        setStartDate(isNew ? DateTime.now() : DateTime.fromISO(event.startsAt))
        setEndDate(isNew ? DateTime.now().plus({ hours: 1 }) : DateTime.fromISO(event.endsAt))
        setZoneName(DateTime.local().zoneName);
    }, []);

    return (
        <>
            <LocalizationProvider dateAdapter={AdapterLuxon}>
                <Stack 
                    spacing={2}
                    sx={{
                        marginBottom: 75
                    }}
                >
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
                                    label="Release winners"
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
                                <VisuallyHiddenInput
                                    name="timezone"
                                    defaultValue={zoneName}
                                />
                                <FormLabel>{`Current timezone: ${zoneName}`}</FormLabel>
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