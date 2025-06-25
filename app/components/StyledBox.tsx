import { styled } from "@mui/material/styles";

export const StyledBox = styled("div")(({ theme }) => ({
    alignSelf: "center",
    width: "90%",
    borderRadius: theme.shape.borderRadius,
    outline: "1px solid",
    boxShadow: "0 0 12px 8px hsla(220, 25%, 80%, 0.2)",
    backdropFilter: "blur(24px)",
    backgroundColor: "hsla(220, 60%, 99%, 1)",
    outlineColor: "hsla(220, 25%, 80%, 0.5)",
    backgroundSize: "cover",
    padding: 20,
    ...theme.applyStyles("dark", {
        backgroundColor: "hsla(0, 0%, 35%, 1)",
        boxShadow: "0 0 24px 12px hsla(210, 100%, 25%, 0.2)",
        outlineColor: "hsla(210, 100%, 80%, 0.1)",
    }),
}));
