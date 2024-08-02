import * as React from "react";
import {
    Box,
    Button,
    Container,
    InputLabel,
    Link,
    Stack,
    TextField,
    Typography
} from "@mui/material";

export interface GleamingHeaderProps {
    title: string,
    description: string
};

export function GleamingHeader({ title, description }: GleamingHeaderProps) {
    return (
        <Box
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
                    <Typography
                        variant="h1"
                        sx={{
                            display: "flex",
                            fontWeight: "bold",
                            flexDirection: { xs: "column", sm: "row" },
                            alignItems: "center",
                            fontSize: "clamp(3rem, 10vw, 3.5rem)",
                        }}
                    >
                        {title}
                    </Typography>
                    {
                        description &&
                        <Typography
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
