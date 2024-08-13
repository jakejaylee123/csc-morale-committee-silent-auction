import * as React from "react";
import { Avatar, Link, PaletteMode, Stack, useColorScheme } from "@mui/material";
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
import { ToggleColorMode } from "./ToggleColorMode";

interface NavigationBarProps {
    bidder?: SerializedBidderWithAdmin
    colorSchemeState: ReturnType<typeof useColorScheme>
}

export function NavigationBar({ bidder, colorSchemeState }: NavigationBarProps) {
    const [open, setOpen] = React.useState(false);
    const { mode, setMode } = colorSchemeState;

    const toggleDrawer = (newOpen: boolean) => () => {
        setOpen(newOpen);
    };

    return (
        <AppBar
            position="fixed"
            sx={{ displayPrint: "none", boxShadow: 0, bgcolor: "transparent", backgroundImage: "none", mt: 2 }}
        >
            <Container
                sx={{
                    px: 0
                }}
                maxWidth="lg"
            >
                <Toolbar
                    variant="regular"
                    sx={(theme) => ({
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexShrink: 0,
                        borderRadius: 999,
                        backdropFilter: "blur(24px)",
                        maxHeight: 40,
                        border: "1px solid",
                        borderColor: "divider",
                        backgroundColor: "hsla(220, 60%, 99%, 0.6)",
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
                                !!bidder?.adminAssignment &&
                                <Button
                                    variant="text"
                                    color="info"
                                    size="small"
                                    href="/admin"
                                >
                                    Admin
                                </Button>
                            }
                            {
                                !!bidder &&
                                <Button
                                    variant="text"
                                    color="info"
                                    size="small"
                                    href="/logout"
                                >
                                    Logout
                                </Button>
                            }
                        </Box>
                    </Box>
                    {
                        bidder &&
                        <Avatar sx={{ alignContent: "end" }}>{
                            `${bidder.firstName.toUpperCase()[0]}${bidder.lastName.toUpperCase()[0]}`
                        }</Avatar>
                    }
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'end',
                            mx: 1,

                        }}
                    >
                        <ToggleColorMode 
                            mode={mode || "light"} 
                            toggleColorMode={() => {
                                setMode(mode === "light" ? "dark" : "light");
                            }} 
                        />
                    </Box>
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
                                {
                                    !!bidder &&
                                    <MenuItem>
                                        <Link
                                            href="/logout"
                                        >Logout</Link>
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
