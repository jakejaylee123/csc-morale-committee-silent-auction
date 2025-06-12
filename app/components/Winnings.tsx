import * as React from "react";
import * as confetti from "canvas-confetti";

import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import SentimentVeryDissatisfied from "@mui/icons-material/SentimentVeryDissatisfied";

import { SerializedBidWithItem } from "~/services/bid.server";
import { SerializedCategoryCode } from "~/services/category.server";
import { SerializedEvent } from "~/services/event.server";

import { ItemTagNumberGenerator } from "~/commons/item.common";
import { MoneyFormatter } from "~/commons/general.common";
import { CategoryCommon } from "~/commons/category.common";

import { StyledBox } from "./StyledBox";

export interface WrappedConfettiProps {
    width: number,
    height: number
};
export interface WinningsProps {
    event: SerializedEvent,
    categories: SerializedCategoryCode[],
    winningBids: SerializedBidWithItem[]
};

const getWinningBidTotal = function (bids: SerializedBidWithItem[]): string {
    return MoneyFormatter.getFormattedMoney({
        amount: bids
            .map(bid => parseFloat(bid.bidAmount || "0"))
            .reduce((accumulator, bidAmount) => accumulator + bidAmount, 0)
    });
};

export function Winnings({ categories, winningBids }: WinningsProps) {
    const categoryHash = React.useRef(CategoryCommon.convertCategoryArrayToHash(categories));
    const generator = new ItemTagNumberGenerator(categoryHash.current);

    const winningBidsWithTagNumbers = winningBids.map(bid => ({
        ...bid,
        tagNumber: generator.getItemTagNumber({
            categoryId: bid.item.categoryId,
            itemNumber: bid.item.itemNumber
        })
    })).sort((lhs, rhs) => {
        return lhs.tagNumber.localeCompare(rhs.tagNumber);
    });

    if (!winningBids.length) {
        return (
            <Stack alignItems="center">
                <StyledBox>
                    <Stack spacing={2} alignItems="center">
                        <Typography variant={"h4"} gutterBottom>You have no winnings for this auction event.</Typography>
                        <SentimentVeryDissatisfied
                            sx={{ width: 100, height: 100 }}
                            fontSize="large"
                        />
                    </Stack>
                </StyledBox>
            </Stack>
        );
    }

    // This is a function that shoots out confetti... Ya know, since
    // the user won something...
    React.useEffect(() => {
        const runConfettiStarter = (starter: confetti.CreateTypes) => {
            if (document.visibilityState !== "hidden") {
                starter({
                    shapes: ["square", "circle"],
                    startVelocity: 25,
                    particleCount: 100,
                    spread: 90,
                    origin: {
                        y: (1),
                        x: (0.5)
                    }
                });
            }
        };

        const canvas = document.createElement('canvas');
        canvas.width = 500;
        canvas.height = 250;
        canvas.style.position = "absolute";
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        document.body.prepend(canvas);

        const confettiStarter = confetti.create(canvas);
        runConfettiStarter(confettiStarter);
        setInterval(() => {
            runConfettiStarter(confettiStarter);
        }, 2000);
    }, []);

    return (
        <Stack alignItems="center">
            <StyledBox>
                <Stack
                    spacing={2}
                >
                    <Stack
                        spacing={2}
                        direction="row"
                    >
                        <Typography
                            variant={"h4"}
                            gutterBottom
                        >{"Winnings"}</Typography>
                        <Typography
                            align="right"
                            flex={1}
                            variant={"h4"}
                            gutterBottom
                        >{"Winning total: " + getWinningBidTotal(winningBids)}</Typography>
                    </Stack>
                    <Alert
                        severity="success"
                        sx={{
                            fontWeight: "bold"
                        }}
                    >Congratulations on your winnings!</Alert>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Item tag number</TableCell>
                                    <TableCell>Description</TableCell>
                                    <TableCell sx={{ textAlign: "right" }}>Winning bid amount</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {
                                    winningBidsWithTagNumbers.map(bid => (
                                        <TableRow
                                            key={`table-row-bid-${bid.id}`}
                                        >
                                            <TableCell>{bid.tagNumber}</TableCell>
                                            <TableCell>{bid.item.itemDescription}</TableCell>
                                            <TableCell sx={{ textAlign: "right" }}>{MoneyFormatter.getFormattedMoney({
                                                amount: bid.bidAmount
                                            })}</TableCell>
                                        </TableRow>
                                    ))
                                }
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Stack>
            </StyledBox>
        </Stack>
    );
};