import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { AdminDashboard } from "~/components/AdminDashboard";
import { requireAuthenticatedBidder } from "~/services/auth.server";
import { EventService, EventWithConvenience } from "~/services/event.server";
import { GleamingHeader } from "~/components/GleamingHeader";
import { APP_NAME } from "~/commons/general.common";

interface AdminLoaderFunctionData {
    events: EventWithConvenience[]
};

export async function loader({ request }: LoaderFunctionArgs): Promise<AdminLoaderFunctionData> {
    await requireAuthenticatedBidder(request, {
        mustBeAdmin: true
    });
    
    return {
        events: await EventService.getAll()
    };
};

export function meta() {
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
