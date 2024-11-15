import * as React from "react";

import {
    Link,
    Paper,
    Typography
 } from "@mui/material";

 function Copyright() {
    return (
        <Typography 
            variant="body2" 
            sx={{ 
                color: "text.secondary", 
                margin: 2,
            }}
        >
            {"Made by "}
            <Link href="https://github.com/jakejaylee123">{"jakejaylee123 "}</Link>
            {`(${new Date().getFullYear()})`}
        </Typography>
    );
}

export function Footer() {
    return (
        <Paper
            className="footer"
            sx={{
                displayPrint: "none",
                borderRadius: "0px",
                display: "flex",
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0
            }}
            elevation={3}
        >
            <Copyright />
        </Paper>
    );
}
