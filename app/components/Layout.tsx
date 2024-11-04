import * as React from "react";

import Container from "@mui/material/Container";
import Box from "@mui/material/Box";

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