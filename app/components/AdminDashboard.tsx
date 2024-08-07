import * as React from "react";

import { SerializedEvent } from "~/services/event.server";
import { EventSelect, EventSelectChangeEvent } from "./EventSelect";
import { StyledBox } from "./StyledBox";
import { Button, ButtonGroup, Stack } from "@mui/material";
import { Add, Edit } from "@mui/icons-material";

export interface AdminDashboardProps {
    events: SerializedEvent[]
};

export function AdminDashboard({ events }: AdminDashboardProps) {
    const [selectedEventId, setSelectedEventId] = React.useState<string | undefined>(undefined);

    const onEventSelectionUpdated = function (event: EventSelectChangeEvent, child: React.ReactNode) {
        setSelectedEventId(event.target.value);
    };

    return (
        <>
            <StyledBox id="image">
                <Stack spacing={2}>
                    <EventSelect
                        events={events}
                        value={selectedEventId}
                        title="Select an auction event to edit"
                        emptyMessage="There are no auction events for editting."
                        emptyMessageStyle="h4"
                        onChange={onEventSelectionUpdated}
                    />
                    <ButtonGroup fullWidth>
                        <Button
                            disabled={undefined === selectedEventId}
                            startIcon={<Edit />}
                            color="primary"
                            href={`/admin/events/${selectedEventId || 0}/edit`}
                        >Edit event</Button>
                        <Button
                            startIcon={<Add />}
                            color="secondary"
                            href="/admin/events/new/edit"
                        >Create event</Button>
                    </ButtonGroup>
                </Stack>
            </StyledBox>
        </>
    );
}