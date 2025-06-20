import IconButton, { IconButtonProps } from "@mui/material/IconButton";

import WbSunnyRounded from "@mui/icons-material/WbSunnyRounded";
import ModeNightRounded from "@mui/icons-material/ModeNightRounded";

export type Mode = "light" | "dark" | "system";
interface ToggleColorModeProps extends IconButtonProps {
    mode: Mode,
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
