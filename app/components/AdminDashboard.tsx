import * as React from "react";

import { SerializedEvent } from "~/services/event.server";
import { EventSelect, EventSelectChangeEvent } from "./EventSelect";
import { StyledBox } from "./StyledBox";
import { Button, ButtonGroup } from "@mui/material";
import { Add, Edit } from "@mui/icons-material";

export interface AdminDashboardProps {
    events: SerializedEvent[]
};

export function AdminDashboard({ events }: AdminDashboardProps) {
    const [selectedEventId, setSelectedEventId] = React.useState<string | undefined>(undefined);
    const [editUrl, setEditUrl] = React.useState<string>("");

    React.useEffect(() => {
        if (selectedEventId) {
            setEditUrl(`/admin/events/${selectedEventId}/edit`);
        }
    }, [selectedEventId]);

    const onEventSelectionUpdated = function (event: EventSelectChangeEvent, child: React.ReactNode) {
        setSelectedEventId(event.target.value);
    };

    return (
        <>
            <StyledBox id="image">
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
                        href={editUrl}
                    >Edit event</Button>
                    <Button 
                        startIcon={<Add />}
                        color="secondary"
                        href="/admin/events/new/edit"
                    >Create event</Button>
                </ButtonGroup>
            </StyledBox>
        </>
    );
}