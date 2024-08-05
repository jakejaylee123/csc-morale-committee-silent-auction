import * as React from "react";

import type { ActionFunction, ActionFunctionArgs, LoaderFunction, SerializeFrom } from "@remix-run/node";

import { requireAuthenticatedBidder } from "../services/auth.server";
import { useActionData } from "@remix-run/react";

import { StyledBox } from "../components/StyledBox";
import { GleamingHeader } from "../components/GleamingHeader";
import { List, ListItem, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";

export type EventItemUploadResult = {
    success: true
} | {
    success: false,
    errors: string[]
};
export type SerializedEventUploadResult = SerializeFrom<EventItemUploadResult>;
export type SerializedNullableEventUploadResult = SerializedEventUploadResult | null | undefined;

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

export const loader = async function ({ request, params }) {
    return null;
} satisfies LoaderFunction;

export const action = async function ({ request, params }: ActionFunctionArgs) {
    await requireAuthenticatedBidder(request, {
        mustBeAdmin: true
    });

    const { id } = params;
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

    console.log("Bad validations: ", badRowArrayValidations);

    if (badRowArrayValidations.length) {
        return {
            success: false,
            errors: badRowArrayValidations
                .map(({ index, array }) => `Row ${index + 1} of the uploaded CSV `
                    + `was not in the expected format (${ITEM_ROW_ARRAY_INDICES.length} `
                    + `cells in length) (row content: "${array.toString()}")`)
        } satisfies EventItemUploadResult;
    }

    return null;
} satisfies ActionFunction;

export default function EventItemUploadResults() {
    const result = useActionData<typeof action>() satisfies SerializedNullableEventUploadResult;
    console.log(result);
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
                                    {(result.errors || []).map((error, index) => (
                                        <TableRow
                                            key={`row-${index}`}
                                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                        >
                                            <TableCell 
                                                component="th" 
                                                scope="row"
                                                align="right"
                                            >
                                                {index + 1}
                                            </TableCell>
                                            <TableCell>{error}</TableCell>
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