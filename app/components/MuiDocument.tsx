import CssBaseline from "@mui/material/CssBaseline";

export function MuiDocument({ children }: { children: React.ReactNode }) {
    return (
        <>
            <CssBaseline />
            {children}
        </>
    );
}