import * as React from "react";
import { Alert, AlertProps } from "@mui/material";

export type StandardAlertProps = Omit< AlertProps, "variant">

export function StandardAlert(props: StandardAlertProps) {
    console.log("Alert children: ", props.children);
    return (
        <Alert {...{
            ...props,
            variant: "filled",
        }}>{props.children}</Alert>
    );
}