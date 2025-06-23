import type { LoaderFunctionArgs } from "@remix-run/node";
import { MetaFunction, useLoaderData } from "@remix-run/react";

import { AdminDashboard } from "~/components/AdminDashboard";
import { requireAuthenticatedBidder } from "~/services/auth.server";
import { EventService, EventWithConvenience } from "~/services/event.server";
import { GleamingHeader } from "~/components/GleamingHeader";
import { APP_NAME, Dto } from "~/commons/general.common";

type AdminLoaderFunctionData = Dto<{
    events: EventWithConvenience[]
}>;

export const loader = async function ({ request }: LoaderFunctionArgs): Promise<AdminLoaderFunctionData> {
    await requireAuthenticatedBidder(request, {
        mustBeAdmin: true
    });
    
    const events = await EventService.getAll();
    return {
        events: events.map(EventService.toDtoWithConvenience)
    };
};

export const meta: MetaFunction<typeof loader> = function ({ data }) {
    return [{ title: `${APP_NAME}: Administration` }];
};

export default function Admin() {
    const { events } = useLoaderData<typeof loader>();
    
    return (
        <>
            <GleamingHeader
                title="Welcome!"
                description=""
            />
            <AdminDashboard
                events={events}
            />
        </>
    );
}
