import * as React from "react";
import { Form } from "@remix-run/react";

import {
    Button,
    ButtonGroup,
    Stack
} from "@mui/material";

import { LoginRounded } from "@mui/icons-material";

import { StyledBox } from "./StyledBox";

export function LoginWithMicrosoft() {
    return (
        <Stack alignContent="center">
            <StyledBox sx={{ maxWidth: { sm: 400, xs: "100%" } }}>
                <Form action="/auth/microsoft" method="post">
                    <ButtonGroup fullWidth>
                        <Button
                            type="submit"
                            startIcon={<LoginRounded />}
                            color="primary"
                        >Sign in with Microsoft</Button>
                    </ButtonGroup>
                </Form>
            </StyledBox>
        </Stack>
    );
}