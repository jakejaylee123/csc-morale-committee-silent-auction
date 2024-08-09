import { Alert, AlertProps } from "@mui/material";

export type StandardAlertProps = Omit< AlertProps, "variant">

export function StandardAlert(props: StandardAlertProps) {
    return (
        <Alert {...{
            ...props,
            variant: "filled",
        }}>{props.children}</Alert>
    );
}