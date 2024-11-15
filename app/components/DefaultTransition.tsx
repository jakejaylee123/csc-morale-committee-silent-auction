import * as React from "react";

import { Grow } from "@mui/material";

import theme from "~/theme";

export type DefaultTransitionProps = {
    children: React.ReactNode
};

export function DefaultTransition({ children }: DefaultTransitionProps) {
    if (process.env.NODE_ENV === "development") {
        return <><div>{children}</div></>;
    } else {
        return (
            <Grow in appear timeout={theme.transitions.duration.short}>
                    <div>{children}</div>
            </Grow>
        );
    }
};