import * as React from "react";

import { Container } from "@mui/material";
import { Box } from "@mui/material";


export function Layout({ children }: { children: React.ReactNode }) {    
    return (
        <Container 
            disableGutters
        >
            <Box sx={{ mb: "100px" }}>
                {children}
            </Box>
        </Container>
    );
}