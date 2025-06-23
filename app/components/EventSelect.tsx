
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography, { TypographyOwnProps } from "@mui/material/Typography";

import SentimentVeryDissatisfied from "@mui/icons-material/SentimentVeryDissatisfied";

import { EventWithConvenience } from "~/services/event.server";
import { Dto, GetPropertyType } from "~/commons/general.common";

type TypographyVariant = GetPropertyType<TypographyOwnProps, "variant">;
export type EventSelectChangeEvent = SelectChangeEvent<string>;
export interface EventSelectProps {
    title: string,
    emptyMessage?: string,
    emptyMessageStyle?: TypographyVariant,
    events: Dto<EventWithConvenience>[]
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