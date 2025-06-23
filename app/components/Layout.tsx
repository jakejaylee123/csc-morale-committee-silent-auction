import { ReactNode } from "react";

import Container from "@mui/material/Container";
import Box from "@mui/material/Box";

export function Layout({ children }: { children: ReactNode }) {    
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