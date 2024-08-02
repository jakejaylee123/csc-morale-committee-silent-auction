import * as React from "react";
import {
    IconButton,
    IconButtonProps,
    PaletteMode
} from "@mui/material";

import {
    WbSunnyRounded,
    ModeNightRounded
} from "@mui/icons-material";

interface ToggleColorModeProps extends IconButtonProps {
    mode: PaletteMode;
    toggleColorMode: () => void;
}

export function ToggleColorMode({
    mode,
    toggleColorMode,
    ...props
}: ToggleColorModeProps) {
    return (
        <IconButton
            onClick={toggleColorMode}
            color="primary"
            aria-label="Theme toggle button"
            size="small"
            {...props}
        >
            {mode === "dark" ? (
                <WbSunnyRounded fontSize="small" />
            ) : (
                <ModeNightRounded fontSize="small" />
            )}
        </IconButton>
    );
}
