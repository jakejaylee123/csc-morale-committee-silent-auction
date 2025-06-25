import { useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useActionData, useLoaderData } from "react-router";

import { DateTime } from "luxon";

import { requireAuthenticatedBidder } from "~/services/auth.server";
import { EventService, EventWithItems, NewEvent, NewOrExistingEvent } from "~/services/event.server";
import { APP_NAME, BasicDto, Dto, Identifiers } from "~/commons/general.common";
import { EventEditor } from "~/components/EventEditor";
import { GleamingHeader } from "~/components/GleamingHeader";
import { CategoryService } from "~/services/category.server";
import { CategoryCode, Event } from "@prisma/client";
import { StandardSnackbar, StandardSnackbarProps } from "~/components/StandardSnackbar";

type EventEditLoaderFunctionData = {
    event: Dto<EventWithItems | null>,
    categories: CategoryCode[]
};

export type EventUpdateType = "create" | "update" | "none";
export type EventUpdateResult = {
    success: false,
    type: EventUpdateType,
    error: string
} | {
    success: true,
    type: EventUpdateType,
    event: Dto<Event>
};

export async function loader({ request, params }: LoaderFunctionArgs): Promise<EventEditLoaderFunctionData> {
    const { bidder } = await requireAuthenticatedBidder(request, {
        mustBeAdmin: true
    });

    const { id } = params;

    const currentDate = DateTime.now().toUTC().toJSDate();
    const event: EventWithItems | null = Identifiers.isNew(id)
        ? {
            id: 0,
            description: "",
            startsAt: currentDate,
            endsAt: currentDate,
            createdAt: currentDate,
            createdBy: bidder.id,
            updatedAt: null,
            updatedBy: null,
            enabled: true,
            disabledAt: null,
            disabledBy: null,
            items: [],
            concluded: false,
            active: false,
            releaseWinners: false
        }
        : Identifiers.isIntegerId(id)
            ? await EventService.get(parseInt(id), { withItems: true })
            : null;

    return {
        event: event === null ? null : EventService.toDtoWithItems(event),
        categories: await CategoryService.getAll()
    };
};

export function meta() {
    return [{ title: `${APP_NAME}: Manage event` }];
};

export async function action({ request, params }: ActionFunctionArgs): Promise<EventUpdateResult> {
    const { bidder } = await requireAuthenticatedBidder(request, {
        mustBeAdmin: true
    });

    const { id } = params;
    const eventRequest = await request.json() as BasicDto<NewOrExistingEvent>;
    console.log("Form data for event edit: ", eventRequest);

    const {
        description,
        enabled,
        startsAt,
        endsAt,
        timezone,
        releaseWinners
    } = eventRequest;

    let type: EventUpdateType = "none"; 
    let changedEvent: Event | null = null;
    try {
        if (Identifiers.isNew(id)) {
            type = "create";
            changedEvent = await EventService.create({
                creatorId: bidder.id,
                event: {
                    description,
                    enabled,
                    startDate: DateTime.fromISO(startsAt, { zone: timezone }).toUTC().toJSDate(),
                    endDate: DateTime.fromISO(endsAt, { zone: timezone }).toUTC().toJSDate(),
                }
            });
        } else if (Identifiers.isIntegerId(id)) {
            type = "update";
            changedEvent = await EventService.update({
                updatorId: bidder.id,
                event: {
                    id: parseInt(id),
                    description,
                    enabled,
                    startDate: DateTime.fromISO(startsAt, { zone: timezone }).toUTC().toJSDate(),
                    endDate: DateTime.fromISO(endsAt, { zone: timezone }).toUTC().toJSDate(),
                    releaseWinners
                }
            });
        } else {
            return {
                success: false,
                type,
                error: `The passed event ID "${id}" was not valid.`
            };
        }
    } catch (error) {
        console.log("Error saving event edit: ", error);

        return {
            success: false,
            type,
            error: JSON.stringify(error)
        };
    }

    return {
        success: true,
        type,
        event: changedEvent
    };
};

export default function AdminEventEdit() {
    const {
        event,
        categories
    } = useLoaderData<typeof loader>();
    const result = useActionData<typeof action>();

    // If we successfully made an auction event, we can change the URL to
    // the proper URL of the newly created auction
    useEffect(() => {
        if (result?.success) {
            try {
                window.history.replaceState(null, "", `/admin/events/${result.event.id}/edit`);
            } catch (error) { }

            if (event) event.id = result.event.id;
        }
    }, []);
    
    const snackBarProps = result ? {
        alerts: [{
            message: result?.success 
                ? `Event successfully ${result?.type === "create" ? "created" : "updated"}.`
                : `Error: ${result?.error}`,
            severity: result?.success ? "success" : "error"
        }]
    } satisfies StandardSnackbarProps : null;

    return (
        <>
            {
                result &&
                <StandardSnackbar {...snackBarProps} />
            }
            <GleamingHeader
                title=""
                description=""
            />
            <EventEditor
                event={event}
                categories={categories} 
            />
        </>
    );
}
