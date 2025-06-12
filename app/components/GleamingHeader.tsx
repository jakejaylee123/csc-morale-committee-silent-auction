import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography, { TypographyOwnProps } from "@mui/material/Typography";

import { GetPropertyType } from "~/commons/general.common";

type TypographyVariant = GetPropertyType<TypographyOwnProps, "variant">;

export interface GleamingHeaderProps {
    title?: string,
    titleVariant?: TypographyVariant,
    description?: string,
    descriptionVariant?: TypographyVariant
};

export function GleamingHeader({ 
    title, 
    titleVariant,
    description,
    descriptionVariant
}: GleamingHeaderProps) {
    return (
        <Box
            displayPrint="none"
            id="hero"
            sx={(theme) => ({
                width: "100%",
                backgroundRepeat: "no-repeat",
                backgroundImage:
                    "radial-gradient(ellipse 80% 50% at 50% -20%, hsl(210, 100%, 90%), transparent)",
                ...theme.applyStyles("dark", {
                    backgroundImage:
                        "radial-gradient(ellipse 80% 50% at 50% -20%, hsl(210, 100%, 16%), transparent)",
                }),
            })}
        >
            <Container
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    pt: { xs: 14, sm: 14 },
                    pb: { xs: 4, sm: 4 },
                }}
            >
                <Stack
                    spacing={2}
                    useFlexGap
                    sx={{ alignItems: "center", width: { xs: "100%", sm: "70%" } }}
                >
                    {
                        title &&
                        <Typography
                            variant={titleVariant || "h1"}
                            sx={{
                                display: "flex",
                                fontWeight: "bold",
                                flexDirection: { xs: "column", sm: "row" },
                                alignItems: "center",
                                textAlign: "center"
                            }}
                        >{title}</Typography>
                    }
                    {
                        description &&
                        <Typography
                            variant={descriptionVariant || "body1"}
                            sx={{
                                textAlign: "center",
                                color: "text.secondary",
                            }}
                        >{description}</Typography>
                    }
                </Stack>
            </Container>
        </Box>
    );
}
