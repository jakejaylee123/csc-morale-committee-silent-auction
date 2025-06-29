import { 
    ReactNode,
    useState
} from "react";

import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import Stack from "@mui/material/Stack";

import PlayArrow from "@mui/icons-material/PlayArrow";
import Article from "@mui/icons-material/Article";
import AutoAwesome from "@mui/icons-material/AutoAwesome";

import { EventCommon } from "~/commons/event.common";

import { EventSelect, EventSelectChangeEvent } from "./EventSelect";
import { StyledBox } from "./StyledBox";
import { Dto } from "~/commons/general.common";
import { EventWithConvenience } from "~/services/event.server";

export type DashboardProps = {
    events: Dto<EventWithConvenience>[]
};

export function Dashboard({ events }: DashboardProps) {
    const [selectedEventId, setSelectedEventId] = useState<string | undefined>(undefined);

    const onEventSelectionUpdated = function (event: EventSelectChangeEvent, _: ReactNode) {
        setSelectedEventId(event.target.value);
    };

    const getEvent = function (eventIdString: string | undefined): Dto<EventWithConvenience> | undefined {
        return eventIdString 
            ? events.find(event => event.id === parseInt(eventIdString))
            : undefined;
    };

    const isEnabledAndActive = function (event: Dto<EventWithConvenience> | undefined): boolean {
        if (!event) return false;
        return EventCommon.isEnabledAndActive(event);
    };

    const isEnabledAndConcluded = function (event: Dto<EventWithConvenience> | undefined): boolean {
        if (!event) return false;
        return EventCommon.isEnabledAndConcluded(event);
    }

    return (
        <Stack alignContent="center">
            <StyledBox sx={{ maxWidth: { sm: 400, xs: "100%" } }}>
                <Stack spacing={2}>
                    <EventSelect
                        events={events}
                        value={selectedEventId}
                        title="Select an auction event to begin bidding"
                        emptyMessage="There are no current auction events for bidding."
                        emptyMessageStyle="h4"
                        onChange={onEventSelectionUpdated}
                    />
                    <ButtonGroup
                        fullWidth
                        orientation="vertical"
                    >
                        <Button
                            disabled={!isEnabledAndActive(getEvent(selectedEventId))}
                            startIcon={<PlayArrow />}
                            color="primary"
                            href={`/events/${selectedEventId || 0}/bids/edit`}
                        >Begin bidding</Button>
                        <Button
                            disabled={undefined === selectedEventId}
                            startIcon={<Article />}
                            color="secondary"
                            href={`/events/${selectedEventId || 0}/reports/bid-sheet`}
                        >View bid sheet</Button>
                        <Button
                            disabled={!isEnabledAndConcluded(getEvent(selectedEventId))}
                            startIcon={<AutoAwesome />}
                            color="secondary"
                            href={`/events/${selectedEventId || 0}/winnings`}
                        >View winnings</Button>
                    </ButtonGroup>
                </Stack>
            </StyledBox>
        </Stack>
    );
}