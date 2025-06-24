import type { LoaderFunctionArgs, MetaDescriptor } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { AdminDashboard } from "~/components/AdminDashboard";
import { requireAuthenticatedBidder } from "~/services/auth.server";
import { EventService, EventWithConvenience } from "~/services/event.server";
import { GleamingHeader } from "~/components/GleamingHeader";
import { APP_NAME, Dto } from "~/commons/general.common";

type AdminLoaderFunctionData = {
    events: Dto<EventWithConvenience>[]
};

export async function loader({ request }: LoaderFunctionArgs): Promise<AdminLoaderFunctionData> {
    await requireAuthenticatedBidder(request, {
        mustBeAdmin: true
    });
    
    const events = await EventService.getAll();
    return {
        events: events.map(EventService.toDtoWithConvenience)
    };
};

export function meta(): MetaDescriptor[] {
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
