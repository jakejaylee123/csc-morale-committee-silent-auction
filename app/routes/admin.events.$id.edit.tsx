import type { ActionFunction, ActionFunctionArgs, LoaderFunction } from "@remix-run/node";
import { json, redirect, useLoaderData } from "@remix-run/react";

import { DateTime } from "luxon";

import { Event } from "@prisma/client";

import { requireAuthenticatedBidder } from "~/services/auth.server";
import { EventService, EventWithItems, SerializedNullableEventWithItems } from "~/services/event.server";
import { Identifiers } from "~/services/common.server";
import { EventEditor } from "~/components/EventEditor";
import { GleamingHeader } from "~/components/GleamingHeader";

interface EventEditLoaderFunctionData {
    event: EventWithItems | null
};
interface SerializedEventEditLoaderFunctionData {
    event: SerializedNullableEventWithItems
};

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

    const data = {
        event
    } satisfies EventEditLoaderFunctionData;

    return json(data);
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

    if (Identifiers.isNew(id)) {
        const newEvent = await EventService.create({
            creatorId: bidder.id,
            event: {
                description,
                enabled,
                startDate: DateTime.fromFormat(startDate, "MM/dd/yyyy hh:mm a"),
                endDate: DateTime.fromFormat(endDate, "MM/dd/yyyy hh:mm a")
            }
        });
        throw redirect(`/admin/events/${newEvent.id}/edit`);
    } else if (Identifiers.isIntegerId(id)) {
        await EventService.update({
            updatorId: bidder.id,
            event: {
                id: parseInt(id),
                description,
                enabled,
                startDate: DateTime.fromFormat(startDate, "MM/dd/yyyy hh:mm a"),
                endDate: DateTime.fromFormat(endDate, "MM/dd/yyyy hh:mm a")
            }
        });
    }

    return null;
} satisfies ActionFunction;

export default function AdminEventEdit() {
    const { event } = useLoaderData<typeof loader>() satisfies SerializedEventEditLoaderFunctionData;

    return (
        <>
            <GleamingHeader
                title=""
                description=""
            />
            <EventEditor
                event={event} />
        </>
    );
}
