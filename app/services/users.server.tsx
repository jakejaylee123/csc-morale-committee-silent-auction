import { PrismaClient, Bidder, AdministrationAssignment } from "@prisma/client";

import { SerializeFrom } from "~/commons/general.common";

export interface BidderFindOrCreateOptions {
    profileId: string,
    displayName: string,
    emailAddress: string,
    firstName: string,
    lastName: string
};

export type SerializedBidder = SerializeFrom<Bidder>;

export type BidderWithAdmin = Bidder & {
    adminAssignment: AdministrationAssignment | null
};
export type SerializedBidderWithAdmin = SerializeFrom<BidderWithAdmin>;

// This is a typical bidder object, but only with minimal (and uniquely identifiable) information
// that can be stored in a cookie session without hitting the size limit. If you need more information
// than just the IDs, you should use the `BidderWithAdmin` type (and its serialized version).
export type AuthenticatedBidder = Pick<BidderWithAdmin, 
    "windowsId" | "id" | "adminAssignment">;
export type SerializedAuthenticatedBidder = SerializeFrom<AuthenticatedBidder>;

export class BidderService {
    /**
     * Finds a bidder based on the provided ID
     * @param id The ID of the user/bidder to retrieve.
     * @returns Found bidder.
     */
    public static async getById(id: number): Promise<BidderWithAdmin | undefined> {
        const prisma = new PrismaClient();
        
        return await prisma.bidder.findFirst({
            where: { id },
            include: {
                adminAssignment: true
            }
        }) || undefined;
    }

    /**
     * Finds a bidder based on the provided profiledId (windowsId). If the
     * bidder is not found, they are created with the passed parameters.
     * @param param0 Information on the bidder to be found or created.
     * @returns Found or created bidder.
     */
    public static async findOrCreate({
        profileId,
        displayName,
        emailAddress,
        firstName,
        lastName
    }: BidderFindOrCreateOptions): Promise<BidderWithAdmin> {
        const prisma = new PrismaClient();
        
        const bidder = await prisma.bidder.findFirst({
            where: { windowsId: profileId },
            include: {
                adminAssignment: true
            }
        });
        if (bidder) return bidder;

        const currentDateTime = new Date().toISOString();
        const newBidder = await prisma.bidder.create({
            data: {
                windowsId: profileId,
                displayName,
                emailAddress,
                firstName,
                lastName,
                enabled: true,
                enabledAt: currentDateTime
            }
        });

        return {
            ...newBidder,
            adminAssignment: null 
        } satisfies BidderWithAdmin;
    }
};