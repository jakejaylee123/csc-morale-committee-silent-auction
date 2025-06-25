import type { ActionFunctionArgs } from "react-router";
import { useActionData } from "react-router";

import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import { requireAuthenticatedBidder } from "~/services/auth.server";
import { ItemService, NewOrExistingItem } from "~/services/item.server";
import { StyledBox } from "~/components/StyledBox";
import { GleamingHeader } from "~/components/GleamingHeader";
import { BasicDto, Identifiers } from "~/commons/general.common";
import { DateTime } from "luxon";

export type EventItemUploadResult = {
    success: true
} | {
    success: false,
    errors: { index: number | string, messages: string[] }[];
};

const ITEM_UPLOAD_FORM_DATA_FILE = "uploadFile";

const ITEM_ROW_ARRAY_INDEX_CATEGORY = 0;
const ITEM_ROW_ARRAY_INDEX_NUMBER = 1;
const ITEM_ROW_ARRAY_INDEX_DESC = 2;
const ITEM_ROW_ARRAY_INDEX_MIN_BID = 3;
const ITEM_ROW_ARRAY_INDICES: readonly number[] = [
    ITEM_ROW_ARRAY_INDEX_CATEGORY,
    ITEM_ROW_ARRAY_INDEX_NUMBER,
    ITEM_ROW_ARRAY_INDEX_DESC,
    ITEM_ROW_ARRAY_INDEX_MIN_BID
];

export async function loader() {
    return null;
};

export async function action({ request, params }: ActionFunctionArgs): Promise<EventItemUploadResult> {
    const { bidder } = await requireAuthenticatedBidder(request, {
        mustBeAdmin: true
    });

    const { id } = params;
    if (!Identifiers.isIntegerId(id)) {
        return {
            success: false,
            errors: [{
                index: "N/A",
                messages: [`The passed event ID "${id}" was not valid`]
            }]
        };
    }

    const formData = await request.formData();
    const uploadFile = formData.get(ITEM_UPLOAD_FORM_DATA_FILE) as File;
    const fileString = await uploadFile.text();

    const useCarriageReturn = fileString.includes("\r\n");
    const lineSplit = useCarriageReturn ? "\r\n" : "\n";
    const lines = fileString.split(lineSplit);

    const rowArrays = lines.map(line => line.split(","));
    const rowArrayValidations = rowArrays.map((array, index) => ({
        array,
        index,
        valid: array.length === ITEM_ROW_ARRAY_INDICES.length
    }));
    const badRowArrayValidations = rowArrayValidations
        .filter(validation => !validation.valid);

    if (badRowArrayValidations.length) {
        return {
            success: false,
            errors: badRowArrayValidations.map((_, index) => ({
                index,
                messages: [`Row did not have ${ITEM_ROW_ARRAY_INDICES.length} cells of data.`]
            }))
        };
    }

    const itemRequests: BasicDto<NewOrExistingItem>[] = rowArrays.map(array => ({
        id: "new",
        eventId: id,
        categoryPrefix: array[ITEM_ROW_ARRAY_INDEX_CATEGORY],
        itemNumber: Number(array[ITEM_ROW_ARRAY_INDEX_NUMBER]),
        itemDescription: array[ITEM_ROW_ARRAY_INDEX_DESC],
        minimumBid: array[ITEM_ROW_ARRAY_INDEX_MIN_BID] ? Number(array[ITEM_ROW_ARRAY_INDEX_MIN_BID]) : null,
        categoryId: 0, // We initialize this as zero because we're using the category prefix
        disqualified: false,
        disqualificationReason: "",
        createdAt: DateTime.now().toISO(),
        createdBy: 0,
        updatedAt: null,
        updatedBy: null,
        disqualifiedBy: null
    }));

    const requestResult = await ItemService.createBulkChangeRequest({
        bidderId: bidder.id,
        itemRequests
    });
    
    if (!requestResult.success) {
        return {
            success: false,
            errors: Object
                .keys(requestResult.errors)
                .map(key => ({
                    index: key,
                    messages: requestResult.errors[key]
                }))
        };
    }

    try {
        await ItemService.createBulk(requestResult.requests);
        return { success: true };
    } catch (error) {
        return {
            success: false,
            errors: [{
                index: "N/A",
                messages: [JSON.stringify(error)]
            }]
        };
    }
};

export default function EventItemUploadResults() {
    const result = useActionData<typeof action>();
    
    return (
        <>
            <GleamingHeader
                title=""
                description=""
            />
            <StyledBox>
                {
                    result &&
                    <>
                        <Typography id="transition-modal-description" sx={{ mt: 2 }}>
                            {"The following errors happened on item upload:"}
                        </Typography>
                        <TableContainer>
                            <Table
                                size="small"
                            >
                                <TableHead>
                                    <TableRow>
                                        <TableCell align="right">Error number</TableCell>
                                        <TableCell>Error message</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {
                                        !result.success &&
                                        (result.errors || []).map((error, index) => (
                                            <TableRow
                                                key={`row-${index}`}
                                                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                                            >
                                                <TableCell
                                                    component="th"
                                                    scope="row"
                                                    align="right"
                                                >
                                                    {error.index}
                                                </TableCell>
                                                <TableCell>
                                                    <List>
                                                        {
                                                            error.messages.map(message => (
                                                                <ListItem>{message}</ListItem>
                                                            ))
                                                        }
                                                </List>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </>
                }
            </StyledBox>
        </>
    );
}