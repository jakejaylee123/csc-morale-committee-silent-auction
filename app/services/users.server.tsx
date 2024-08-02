import { SerializeFrom } from "@remix-run/node";
import { PrismaClient, Bidder, AdministrationAssignment } from "@prisma/client";

export interface BidderFindOrCreateOptions {
    profileId: string,
    displayName: string,
    emailAddress: string,
    firstName: string,
    lastName: string
};

export type BidderWithAdmin = Bidder & {
    adminAssignment: AdministrationAssignment | null
};
export type SerializedBidderWithAdmin = SerializeFrom<BidderWithAdmin>;

export class BidderService {
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