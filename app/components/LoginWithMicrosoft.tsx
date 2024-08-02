import * as React from "react";

import { StyledBox } from "./StyledBox";
import { Form } from "@remix-run/react";
import { Button, ButtonGroup, Typography } from "@mui/material";
import { LoginRounded } from "@mui/icons-material";

export function LoginWithMicrosoft() {
    return (
        <>
            <StyledBox id="image">
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