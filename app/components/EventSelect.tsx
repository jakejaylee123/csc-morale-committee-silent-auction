import { SentimentVeryDissatisfied } from "@mui/icons-material";
import {
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    SelectChangeEvent,
    Stack,
    Typography
} from "@mui/material";
import { Variant } from "@mui/material/styles/createTypography";

import { SerializedEvent } from "~/services/event.server";

export type EventSelectChangeEvent = SelectChangeEvent<string>;
export interface EventSelectProps {
    title: string,
    emptyMessage?: string,
    emptyMessageStyle?: Variant,
    events: SerializedEvent[]
    value: string | undefined,
    onBlur?: React.FocusEventHandler<any>;
    onChange?: (event: EventSelectChangeEvent, child: React.ReactNode) => void;
};

export function EventSelect({
    events,
    title,
    emptyMessage,
    emptyMessageStyle,
    value,
    onBlur,
    onChange
}: EventSelectProps): JSX.Element | null {
    if (!events.length) {
        return emptyMessage ? (
            <>
                <Stack alignItems="center">
                    <Typography variant={emptyMessageStyle || "body1"} gutterBottom>{emptyMessage}</Typography>
                    <SentimentVeryDissatisfied
                        sx={{ width: 100, height: 100 }}
                        fontSize="large"
                    />
                </Stack>
            </>
        ) : (
            null
        );
    }

    return (
        <FormControl fullWidth>
            <InputLabel id="event-select-label">{title}</InputLabel>
            <Stack alignItems="center">
                <Select
                    labelId="event-select-label"
                    id="event-select"
                    value={value}
                    label={title}
                    onBlur={onBlur}
                    onChange={onChange}
                    fullWidth
                >
                    {events.map(event => <MenuItem value={event.id}>{event.description}</MenuItem>)}
                </Select>
            </Stack>
        </FormControl>
    );
}