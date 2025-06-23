import { ReactNode } from "react";

import Grow from "@mui/material/Grow";

import theme from "~/theme";

export type DefaultTransitionProps = {
    children: ReactNode
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