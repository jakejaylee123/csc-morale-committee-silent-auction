import {
    extendTheme,
    createTheme,
    alpha
} from "@mui/material/styles";

declare module "@mui/material/styles/createPalette" {
    interface ColorRange {
        50: string;
        100: string;
        200: string;
        300: string;
        400: string;
        500: string;
        600: string;
        700: string;
        800: string;
        900: string;
    }

    interface PaletteColor extends ColorRange { }
}

export const brand = {
    50: "hsl(210, 100%, 97%)",
    100: "hsl(210, 100%, 90%)",
    200: "hsl(210, 100%, 80%)",
    300: "hsl(210, 100%, 65%)",
    400: "hsl(210, 98%, 48%)",
    500: "hsl(210, 98%, 42%)",
    600: "hsl(210, 98%, 55%)",
    700: "hsl(210, 100%, 35%)",
    800: "hsl(210, 100%, 16%)",
    900: "hsl(210, 100%, 21%)",
};

export const gray = {
    50: "hsl(220, 60%, 99%)",
    100: "hsl(220, 35%, 94%)",
    200: "hsl(220, 35%, 88%)",
    300: "hsl(220, 25%, 80%)",
    400: "hsl(220, 20%, 65%)",
    500: "hsl(220, 20%, 42%)",
    600: "hsl(220, 25%, 35%)",
    700: "hsl(220, 25%, 25%)",
    800: "hsl(220, 25%, 10%)",
    900: "hsl(220, 30%, 5%)",
};

export const green = {
    50: "hsl(120, 80%, 98%)",
    100: "hsl(120, 75%, 94%)",
    200: "hsl(120, 75%, 87%)",
    300: "hsl(120, 61%, 77%)",
    400: "hsl(120, 44%, 53%)",
    500: "hsl(120, 59%, 30%)",
    600: "hsl(120, 70%, 25%)",
    700: "hsl(120, 75%, 16%)",
    800: "hsl(120, 84%, 10%)",
    900: "hsl(120, 87%, 6%)",
};

export const orange = {
    50: "hsl(45, 100%, 97%)",
    100: "hsl(45, 92%, 90%)",
    200: "hsl(45, 94%, 80%)",
    300: "hsl(45, 90%, 65%)",
    400: "hsl(45, 90%, 40%)",
    500: "hsl(45, 90%, 35%)",
    600: "hsl(45, 91%, 25%)",
    700: "hsl(45, 94%, 20%)",
    800: "hsl(45, 95%, 16%)",
    900: "hsl(45, 93%, 12%)",
};

export const red = {
    50: "hsl(0, 100%, 97%)",
    100: "hsl(0, 92%, 90%)",
    200: "hsl(0, 94%, 80%)",
    300: "hsl(0, 90%, 65%)",
    400: "hsl(0, 90%, 40%)",
    500: "hsl(0, 90%, 30%)",
    600: "hsl(0, 91%, 25%)",
    700: "hsl(0, 94%, 20%)",
    800: "hsl(0, 95%, 16%)",
    900: "hsl(0, 93%, 12%)",
};

const placeholderTheme = createTheme();
export default extendTheme({
    colorSchemes: {
        light: {
            palette: {
                primary: {
                    light: brand[200],
                    main: brand[500],
                    dark: brand[800],
                    contrastText: brand[50]
                },
                info: {
                    light: brand[100],
                    main: brand[300],
                    dark: brand[600],
                    contrastText: gray[50],
                },
                warning: {
                    light: orange[300],
                    main: orange[400],
                    dark: orange[800],
                },
                error: {
                    light: red[300],
                    main: red[400],
                    dark: red[800],
                },
                success: {
                    light: green[300],
                    main: green[400],
                    dark: green[800],
                },
                grey: {
                    ...gray,
                },
                divider: alpha(gray[300], 0.5),
                background: {
                    default: "hsl(0, 0%, 100%)",
                    paper: gray[100],
                },
                text: {
                    primary: gray[800],
                    secondary: gray[600],
                },
                action: {
                    selected: `${alpha(brand[200], 0.2)}`,
                },
            }
        },
        dark: {
            palette: {
                primary: {
                    contrastText: brand[50],
                    light: brand[300],
                    main: brand[400],
                    dark: brand[800],
                },
                info: {
                    contrastText: brand[300],
                    light: brand[500],
                    main: brand[700],
                    dark: brand[900],
                },
                warning: {
                    light: orange[400],
                    main: orange[500],
                    dark: orange[700],
                },
                error: {
                    light: red[400],
                    main: red[500],
                    dark: red[700],
                },
                success: {
                    light: green[400],
                    main: green[500],
                    dark: green[700],
                },
                grey: {
                    ...gray,
                },
                divider: alpha(gray[600], 0.3),
                background: {
                    default: "hsl(220, 30%, 3%)",
                    paper: gray[900],
                },
                text: {
                    primary: "hsl(0, 0%, 100%)",
                    secondary: gray[400],
                },
                action: {
                    selected: alpha(brand[800], 0.2),
                },
            }
        }
    },
    typography: {
        h1: {
            fontSize: placeholderTheme.typography.pxToRem(60),
            fontWeight: 600,
            lineHeight: 1.2,
            letterSpacing: -0.5,
        },
        h2: {
            fontSize: placeholderTheme.typography.pxToRem(48),
            fontWeight: 600,
            lineHeight: 1.2,
        },
        h3: {
            fontSize: placeholderTheme.typography.pxToRem(42),
            lineHeight: 1.2,
        },
        h4: {
            fontSize: placeholderTheme.typography.pxToRem(36),
            fontWeight: 500,
            lineHeight: 1.5,
        },
        h5: {
            fontSize: placeholderTheme.typography.pxToRem(20),
            fontWeight: 600,
        },
        h6: {
            fontSize: placeholderTheme.typography.pxToRem(18),
        },
        subtitle1: {
            fontSize: placeholderTheme.typography.pxToRem(18),
        },
        subtitle2: {
            fontSize: placeholderTheme.typography.pxToRem(16),
        },
        body1: {
            fontSize: placeholderTheme.typography.pxToRem(15),
            fontWeight: 400,
        },
        body2: {
            fontSize: placeholderTheme.typography.pxToRem(14),
            fontWeight: 400,
        },
        caption: {
            fontSize: placeholderTheme.typography.pxToRem(12),
            fontWeight: 400,
        },
    },
    shape: {
        borderRadius: 12,
    },
    transitions: {
        duration: {
            shortest: 200,
            shorter: 300,
            short: 400,
            standard: 500,
            complex: 700,
            enteringScreen: 500,
            leavingScreen: 500,
        }
    },
    components: {
        MuiContainer: {
            styleOverrides: {
                root: {
                    padding: "0px"
                }
            }
        },
        MuiTableCell: {
            styleOverrides: {
                root: ({ theme }) => ({
                    padding: "6px",
                    border: "1px solid black",
                    ...theme.applyStyles('dark', {
                        border: "1px solid white",
                        "@media print": {
                            border: "1px solid black",
                            color: "black",
                        }
                    }),
                }),
            },
        },
        MuiTypography: {
            styleOverrides: {
                root: ({ theme }) => ({
                    ...theme.applyStyles('dark', {
                        "@media print": {
                            color: "black",
                        }
                    }),
                })
            }
        },
    }
});

//export const theme = extendTheme() createTheme(getThemeOptions("dark"));
