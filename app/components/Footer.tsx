import * as React from "react";
import {
    Box,
    Container,
    IconButton,
    Link,
    Stack,
    Typography
} from "@mui/material";

import {
    Facebook,
    LinkedIn,
    Twitter
} from "@mui/icons-material";


function Copyright() {
    return (
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>
            {"Made by "}
            <Link href="https://github.com/jakejaylee123">{"jakejaylee123 "}</Link>
            {`(${new Date().getFullYear()})`}
        </Typography>
    );
}

export function Footer() {
    return (
        <Container
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: { xs: 4, sm: 8 },
                py: { xs: 4, sm: 12 },
                textAlign: { sm: "center", md: "left" },
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    width: "100%",
                    justifyContent: "space-between",
                }}
            >
            </Box>
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    pt: { xs: 4, sm: 8 },
                    width: "100%",
                    borderTop: "1px solid",
                    borderColor: "divider",
                }}
            >
                <div>
                    <Copyright />
                </div>
            </Box>
        </Container>
    );
}
