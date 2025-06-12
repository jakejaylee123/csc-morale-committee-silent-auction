import { Form } from "@remix-run/react";

import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import Stack from "@mui/material/Stack";

import LoginRounded from "@mui/icons-material/LoginRounded";

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