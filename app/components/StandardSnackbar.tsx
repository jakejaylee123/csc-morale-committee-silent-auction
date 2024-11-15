import React from "react";

import {
    Alert,
    AlertColor,
    Snackbar,
    SnackbarProps
} from "@mui/material";

export type StandardAlertProps = { message: string, severity: AlertColor }
export type StandardSnackbarProps = Omit<SnackbarProps, "autoHideDuration" | "anchorOrigin" | "children"> & {
    alerts?: StandardAlertProps[] 
};

export function StandardSnackbar(props: StandardSnackbarProps) {
    const [open, setOpen] = React.useState(true);
    const onClose = function () {
        setOpen(false);
    };

    return (
        <Snackbar 
            {...{
                open,
                onClose,
                autoHideDuration: 6000,
                anchorOrigin: {
                    vertical: "top", 
                    horizontal: "center" 
                },
                ...props
            }}
        >
            <div>
                {
                    props.alerts?.map((alert, index) => (
                        <Alert 
                            key={`snack-bar-alert-${index}`}
                            children={alert.message} 
                            severity={alert.severity}
                            variant="filled" 
                        />
                    ))
                }
            </div>
        </Snackbar>
    );
};