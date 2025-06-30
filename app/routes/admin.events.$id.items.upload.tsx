import type { ActionFunctionArgs } from "react-router";
import { useActionData } from "react-router";

import Alert from "@mui/material/Alert";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import { requireAuthenticatedBidder } from "~/services/auth.server";
import { ItemService, NewOrExistingItem } from "~/services/item.server";
import { StyledBox } from "~/components/StyledBox";
import { GleamingHeader } from "~/components/GleamingHeader";
import { BasicDto, Identifiers } from "~/commons/general.common";

export type EventItemUploadResult = {
    success: true
} | {
    success: false,
    errors: { 
        index: number | string, 
        content?: string,
        messages: string[] 
    }[];
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
    const eventId = Number(id);

    const formData = await request.formData();
    const uploadFile = formData.get(ITEM_UPLOAD_FORM_DATA_FILE) as File;
    const fileString = await uploadFile.text();

    const useCarriageReturn = fileString.includes("\r\n");
    const lineSplit = useCarriageReturn ? "\r\n" : "\n";
    const lines = fileString.split(lineSplit);

    const splitLines = lines.map(line => line.split(","));
    const rowArrayValidations = splitLines.map((splitLine, index) => ({
        line: lines[index],
        splitLine,
        index,
        skip: "" === lines[index].trim(),
        valid: splitLine.length === ITEM_ROW_ARRAY_INDICES.length
    }));
    const badRowArrayValidations = rowArrayValidations
        .filter(validation => !validation.skip && !validation.valid);

    if (badRowArrayValidations.length) {
        return {
            success: false,
            errors: badRowArrayValidations.map((validation, index) => ({
                index,
                content: validation.line,
                messages: [`Row did not have ${ITEM_ROW_ARRAY_INDICES.length} cells of data.`]
            }))
        };
    }

    const itemRequests: BasicDto<NewOrExistingItem>[] = splitLines
        .filter((_, index) => !rowArrayValidations[index].skip)
        .map(splitLine => ({
            id: "new",
            eventId,
            categoryPrefix: splitLine[ITEM_ROW_ARRAY_INDEX_CATEGORY],
            itemNumber: Number(splitLine[ITEM_ROW_ARRAY_INDEX_NUMBER]),
            itemDescription: splitLine[ITEM_ROW_ARRAY_INDEX_DESC],
            minimumBid: splitLine[ITEM_ROW_ARRAY_INDEX_MIN_BID] ? Number(splitLine[ITEM_ROW_ARRAY_INDEX_MIN_BID]) : null,
            categoryId: 0, // We initialize this as zero because we're using the category prefix
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
        console.log("Error uploading auction event items: ", error);

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
                title="Item upload results"
                description=""
            />
            <Stack spacing={2} sx={{ marginBottom: 75 }}>
                <StyledBox>
                    <Stack spacing={2}>
                        <Alert
                            severity={result?.success ? "success" : "error"}
                            sx={{ fontWeight: "bold" }}
                        >{
                            result?.success
                                ? "Items uploaded successfully."
                                : "The following errors happened on item upload. Once you finish reviewing errors, "
                                    + "click the 'Back' button on your browser to try again."
                        }</Alert>
                        {
                            !result?.success &&
                            <TableContainer component={Paper}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell align="right">Error number</TableCell>
                                            <TableCell>Content</TableCell>
                                            <TableCell>Error message</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {
                                            result?.errors.map((error, index) => (
                                                <TableRow
                                                    key={`row-${index}`}
                                                >
                                                    <TableCell
                                                        component="th"
                                                        scope="row"
                                                        align="right"
                                                    >
                                                        {error.index}
                                                    </TableCell>
                                                    <TableCell>{error.content || "N/A"}</TableCell>
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
                        }
                    </Stack>
                </StyledBox>
            </Stack>
        </>
    );
}