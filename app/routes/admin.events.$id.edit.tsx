import { useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";

import { DateTime } from "luxon";

import { requireAuthenticatedBidder } from "~/services/auth.server";
import { EventService, EventWithItems } from "~/services/event.server";
import { APP_NAME, Dto, Identifiers } from "~/commons/general.common";
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

const REQUEST_DATE_FORMAT = "MM/dd/yyyy hh:mm a";

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
    const eventDto: Dto<EventWithItems | null> = event === null ? null : {
        ...event,
        items: event.items.map(item => ({
            ...item,
            minimumBid: item?.minimumBid?.toNumber() || null
        }))
    };

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
    const formData = await request.formData();
    console.log("Form data for event edit: ", formData);

    const description = formData.get("description") as string;
    const enabled = "true" === formData.get("enabled");
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;
    const timezone = formData.get("timezone") as string;
    const releaseWinners = formData.get("releaseWinners") as string;

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
                    startDate: DateTime.fromFormat(startDate, REQUEST_DATE_FORMAT, { zone: timezone }).toUTC(),
                    endDate: DateTime.fromFormat(endDate, REQUEST_DATE_FORMAT, { zone: timezone }).toUTC(),
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
                    startDate: DateTime.fromFormat(startDate, REQUEST_DATE_FORMAT, { zone: timezone }).toUTC(),
                    endDate: DateTime.fromFormat(endDate, REQUEST_DATE_FORMAT, { zone: timezone }).toUTC(),
                    releaseWinners: releaseWinners === "true"
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
