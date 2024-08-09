import * as React from "react";
import { Alert, AlertProps } from "@mui/material";

export type StandardAlertProps = Omit<AlertProps, "variant">;
export interface StandardAlertComponent extends React.ReactElement<any, any> { };

export function StandardAlert(props: StandardAlertProps) {
    return (
        <Alert {...props} variant="filled" />
    );
}