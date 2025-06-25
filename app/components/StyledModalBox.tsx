import { styled } from "@mui/material/styles";

export const StyledModalBox = styled("div")(({ theme }) => ({
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    borderRadius: theme.shape.borderRadius,
    outline: "1px solid",
    boxShadow: "0 0 12px 8px hsla(220, 25%, 80%, 0.2)",
    outlineColor: "hsla(220, 25%, 80%, 0.5)",
    backgroundSize: "cover",
    padding: 20,
    ...theme.applyStyles("dark", {
        backgroundColor: "hsla(0, 0%, 35%, 0.6)",
        boxShadow: "0 0 24px 12px hsla(210, 100%, 25%, 0.2)",
        outlineColor: "hsla(210, 100%, 80%, 0.1)",
    }),
}));
