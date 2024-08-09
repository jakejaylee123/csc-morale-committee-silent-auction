import { Snackbar, SnackbarProps } from "@mui/material";

type StandardSnackbarProps = Omit<SnackbarProps, "autoHideDuration" | "anchorOrigin" | "open">;

export function StandardSnackbar(props: StandardSnackbarProps) {
    return (
        <Snackbar
            {...props}
            open
            autoHideDuration={6000}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >{props.children}</Snackbar>
    );
}