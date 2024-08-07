import type { ActionFunction, ActionFunctionArgs, LoaderFunction, SerializeFrom } from "@remix-run/node";
import { json, redirect, useActionData, useLoaderData } from "@remix-run/react";

import { DateTime } from "luxon";

import { requireAuthenticatedBidder } from "~/services/auth.server";
import { EventService, EventWithItems, SerializedNullableEventWithItems } from "~/services/event.server";
import { Identifiers } from "~/services/common.server";
import { EventEditor } from "~/components/EventEditor";
import { GleamingHeader } from "~/components/GleamingHeader";
import { CategoryService, SerializedCategoryCode } from "~/services/category.server";
import { CategoryCode, Event } from "@prisma/client";
import { Alert, Snackbar } from "@mui/material";

interface EventEditLoaderFunctionData {
    event: EventWithItems | null,
    categories: CategoryCode[]
};
interface SerializedEventEditLoaderFunctionData {
    event: SerializedNullableEventWithItems
    categories: SerializedCategoryCode[]
};

export type EventUpdateResult = {
    success: false,
    error: string
} | {
    success: true,
    event: Event
};
export type SerializedEventUpdateResult = SerializeFrom<EventUpdateResult>;
export type SerializedNullableEventUpdateResult = SerializedEventUpdateResult | null | undefined;

export const loader = async function ({ request, params }) {
    const { bidder } = await requireAuthenticatedBidder(request, {
        mustBeAdmin: true
    });

    const { id } = params;

    const currentDate = DateTime.now().toUTC().toJSDate();
    const event = await (async () => {
        if (Identifiers.isNew(id)) {
            return {
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
                items: []
            } satisfies EventWithItems;
        } else if (Identifiers.isIntegerId(id)) {
            return await EventService
                .get(parseInt(id), { withItems: true }) as EventWithItems;
        } else {
            return null;
        }
    })() satisfies EventWithItems | null;

    return json({
        event,
        categories: await CategoryService.getAll()
    } satisfies EventEditLoaderFunctionData);
} satisfies LoaderFunction;

export const action = async function ({ request, params }: ActionFunctionArgs) {
    const { bidder } = await requireAuthenticatedBidder(request, {
        mustBeAdmin: true
    });

    const { id } = params;
    const formData = await request.formData();
    const description = formData.get("description") as string;
    const enabled = "true" === formData.get("enabled");
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;

    let changedEvent: Event | null = null;
    try {
        if (Identifiers.isNew(id)) {
            changedEvent = await EventService.create({
                creatorId: bidder.id,
                event: {
                    description,
                    enabled,
                    startDate: DateTime.fromFormat(startDate, "MM/dd/yyyy hh:mm a"),
                    endDate: DateTime.fromFormat(endDate, "MM/dd/yyyy hh:mm a")
                }
            });
        } else if (Identifiers.isIntegerId(id)) {
            changedEvent = await EventService.update({
                updatorId: bidder.id,
                event: {
                    id: parseInt(id),
                    description,
                    enabled,
                    startDate: DateTime.fromFormat(startDate, "MM/dd/yyyy hh:mm a"),
                    endDate: DateTime.fromFormat(endDate, "MM/dd/yyyy hh:mm a")
                }
            });
        } else {
            return json({
                success: false,
                error: `The passed event ID "${id}" was not valid`
            } satisfies EventUpdateResult);
        }
    } catch (error) {
        return json({
            success: false,
            error: (error as Error).message || "Unknown error occurred."
        } satisfies EventUpdateResult);
    }

    return json({
        success: true,
        event: changedEvent as Event
    } satisfies EventUpdateResult);
} satisfies ActionFunction;

export default function AdminEventEdit() {
    const {
        event,
        categories
    } = useLoaderData<typeof loader>() satisfies SerializedEventEditLoaderFunctionData;
    const result = useActionData<typeof action>() satisfies SerializedNullableEventUpdateResult;

    // If we successfully made an auction event, we can change the URL to
    // the proper URL of the newly created auction
    if (result?.success) {
        window.history.replaceState(null, "", `/admin/events/${result.event.id}/edit`);
        if (event) event.id = result.event.id;
    }
    
    return (
        <>
            {
                result &&
                <Snackbar
                    open
                    autoHideDuration={6000}
                >
                    <Alert 
                        severity={result.success ? "success" : "error"}
                    >
                        {
                            result.success 
                                ? "Event successfully created."
                                : `Error: ${result.error}`
                        }
                    </Alert>
                </Snackbar>
            }
            <GleamingHeader
                title=""
                description=""
            />
            <EventEditor
                event={event}
                categories={categories} />
        </>
    );
}
