import {
    useEffect,
    useRef
 } from "react";
import * as confetti from "canvas-confetti";

import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import SentimentVeryDissatisfied from "@mui/icons-material/SentimentVeryDissatisfied";

import { CategoryCode, Item } from "@prisma/client";

import { BidWithItem, BidWithItemAndBidder } from "~/services/bid.server";
import { EventWithConvenience } from "~/services/event.server";

import { ItemTagNumberGenerator } from "~/commons/item.common";
import { Dto, MoneyFormatter } from "~/commons/general.common";
import { CategoryCommon } from "~/commons/category.common";

import { StyledBox } from "./StyledBox";
import { WinnerReport } from "./WinnerReport";

export type WrappedConfettiProps = {
    width: number,
    height: number
};
export type WinningsProps = {
    title: string,
    event: Dto<EventWithConvenience>,
    categories: Dto<CategoryCode>[],
    winningBids: Dto<BidWithItemAndBidder>[],
    disqualifiedItems: Dto<Item>[],
    bidderId: number
};

const getWinningBidTotal = function (bids: Dto<BidWithItem>[]): string {
    return MoneyFormatter.getFormattedMoney({
        amount: bids
            .map(bid => bid.bidAmount)
            .reduce((accumulator, bidAmount) => accumulator + bidAmount, 0)
    });
};

export function Winnings({ title, event, categories, winningBids, disqualifiedItems, bidderId }: WinningsProps) {
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
    useEffect(() => {
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

        const canvas = document.createElement("canvas");
        canvas.width = 500;
        canvas.height = 250;
        canvas.style.position = "fixed";
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
                    <WinnerReport 
                        title={title}
                        categories={categories}
                        winningBids={winningBids}
                        disqualifiedItems={disqualifiedItems}
                        bidderId={bidderId} 
                        event={event} />
                </Stack>
            </StyledBox>
        </Stack>
    );
};