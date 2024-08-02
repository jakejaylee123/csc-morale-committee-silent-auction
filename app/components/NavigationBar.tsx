import * as React from "react";
import { Avatar, Link, PaletteMode } from "@mui/material";
import {
    AppBar,
    Box,
    Button,
    Container,
    Divider,
    Drawer,
    MenuItem,
    IconButton,
    Toolbar,
} from "@mui/material";
import {
    CloseRounded,
    Image,
    Menu
} from "@mui/icons-material";

import { SerializedBidderWithAdmin } from "~/services/users.server";
import { CscIcon } from "./CscIcon";

interface NavigationBarProps {
    bidder?: SerializedBidderWithAdmin
}

export function NavigationBar({ bidder }: NavigationBarProps) {
    const [open, setOpen] = React.useState(false);

    const toggleDrawer = (newOpen: boolean) => () => {
        setOpen(newOpen);
    };

    const scrollToSection = (sectionId: string) => {
        const sectionElement = document.getElementById(sectionId);
        const offset = 128;
        if (sectionElement) {
            const targetScroll = sectionElement.offsetTop - offset;
            sectionElement.scrollIntoView({ behavior: "smooth" });
            window.scrollTo({
                top: targetScroll,
                behavior: "smooth",
            });
            setOpen(false);
        }
    };

    return (
        <AppBar
            position="fixed"
            sx={{ boxShadow: 0, bgcolor: "transparent", backgroundImage: "none", mt: 2 }}
        >
            <Container maxWidth="lg">
                <Toolbar
                    variant="regular"
                    sx={(theme) => ({
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexShrink: 0,
                        borderRadius: "999px",
                        backdropFilter: "blur(24px)",
                        maxHeight: 40,
                        border: "1px solid",
                        borderColor: "divider",
                        bgcolor: "hsla(220, 60%, 99%, 0.6)",
                        boxShadow:
                            "0 1px 2px hsla(210, 0%, 0%, 0.05), 0 2px 12px hsla(210, 100%, 80%, 0.5)",
                        ...theme.applyStyles("dark", {
                            bgcolor: "hsla(220, 0%, 0%, 0.7)",
                            boxShadow:
                                "0 1px 2px hsla(210, 0%, 0%, 0.5), 0 2px 12px hsla(210, 100%, 25%, 0.3)",
                        }),
                    })}
                >
                    <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center", px: 0 }}>
                        <CscIcon />
                        <Box sx={{ display: { xs: "none", md: "flex" } }}>
                            <Button
                                variant="text"
                                color="info"
                                size="small"
                                href={bidder ? "/" : "/login"}
                            >{bidder ? "Dashboard" : "Login"}</Button>
                            {
                                !!bidder?.adminAssignment && <Button
                                    variant="text"
                                    color="info"
                                    size="small"
                                    href="Admin"
                                >
                                    Admin
                                </Button>
                            }
                        </Box>
                    </Box>
                    <Box
                        sx={{
                            display: { xs: "none", md: "flex" },
                            gap: 0.5,
                            alignItems: "center",
                        }}
                    >
                    </Box>
                    {
                        bidder && 
                        <Avatar>{
                            `${bidder.firstName.toUpperCase()[0]}${bidder.lastName.toUpperCase()[0]}`
                        }</Avatar>
                    }
                    <Box sx={{ display: { sm: "flex", md: "none" } }}>
                        <IconButton aria-label="Menu button" onClick={toggleDrawer(true)}>
                            <Menu />
                        </IconButton>
                        <Drawer anchor="top" open={open} onClose={toggleDrawer(false)}>
                            <Box sx={{ p: 2, backgroundColor: "background.default" }}>
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                    }}
                                >
                                    <IconButton onClick={toggleDrawer(false)}>
                                        <CloseRounded />
                                    </IconButton>
                                </Box>
                                <Divider sx={{ my: 3 }} />
                                <MenuItem>
                                    <Link
                                        href={bidder ? "/" : "/login"}
                                    >{bidder ? "Dashboard" : "Login"}</Link>
                                </MenuItem>
                                {
                                    !!bidder?.adminAssignment &&
                                    <MenuItem>
                                        <Link
                                            href="/admin"
                                        >Admin</Link>
                                    </MenuItem>
                                }
                            </Box>
                        </Drawer>
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    );
}