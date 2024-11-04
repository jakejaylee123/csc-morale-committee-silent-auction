import * as React from "react";
import { Form } from "@remix-run/react";

import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";

import LoginRounded from "@mui/icons-material/LoginRounded";

import { StyledBox } from "./StyledBox";

export function LoginWithMicrosoft() {
    return (
        <>
            <StyledBox>
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
        </>
    );
}