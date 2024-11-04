import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Typography";
import Typography from "@mui/material/Typography";
import { SelectChangeEvent } from "@mui/material/Select";
import { Variant } from "@mui/material/styles/createTypography";

import SentimentVeryDissatisfied from "@mui/icons-material/SentimentVeryDissatisfied";

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
                    {
                        events.map(event => (
                            <MenuItem 
                                key={`menu-item-event-${event.id}`}
                                value={event.id}
                            >{event.description}</MenuItem>
                        ))
                    }
                </Select>
            </Stack>
        </FormControl>
    );
}