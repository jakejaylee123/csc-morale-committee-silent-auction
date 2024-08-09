import * as React from "react";

import { SerializedEvent } from "~/services/event.server";
import { EventSelect, EventSelectChangeEvent } from "./EventSelect";
import { StyledBox } from "./StyledBox";
import { Button, ButtonGroup, Stack } from "@mui/material";
import { PlayArrow, Article } from "@mui/icons-material";

export interface DashboardProps {
    events: SerializedEvent[]
};

export function Dashboard({ events }: DashboardProps) {
    const [selectedEventId, setSelectedEventId] = React.useState<string | undefined>(undefined);

    const onEventSelectionUpdated = function (event: EventSelectChangeEvent, child: React.ReactNode) {
        setSelectedEventId(event.target.value);
    };

    return (
        <>
            <StyledBox>
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
                            disabled={undefined === selectedEventId}
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
                    </ButtonGroup>
                </Stack>
            </StyledBox>
        </>
    );
}