import * as React from "react";

import Backdrop from "@mui/material/Backdrop";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import Fade from "@mui/material/Fade";
import Modal from "@mui/material/Modal";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { StyledModalBox } from "./StyledModalBox";

export interface StandardModalProps {
    open: boolean,
    title?: string,
    description?: string,
    children?: React.ReactElement<any, string | React.JSXElementConstructor<any>>,
    onClose: (event: {}, reason: "backdropClick" | "escapeKeyDown") => void
};
export type StandardOkModalProps = Omit<StandardModalProps, "children"> & {
    onOk: () => void
};

export function StandardOkModal(props: StandardOkModalProps) {
    return (
        <StandardModal {...props}>
            <ButtonGroup
                fullWidth
            >
                <Button
                    type="submit"
                    color="primary"
                    onClick={() => {
                        props.onOk();
                    }}
                >
                    OK
                </Button>
            </ButtonGroup>
        </StandardModal>
    )
}

export function StandardModal({
    open,
    title,
    description,
    children,
    onClose
}: StandardModalProps) {
    return (
        <Modal
            aria-labelledby="transition-modal-title"
            aria-describedby="transition-modal-description"
            open={open}
            onClose={onClose}
            closeAfterTransition
            slots={{ backdrop: Backdrop }}
            slotProps={{
                backdrop: {
                    timeout: 500,
                },
            }}
        >
            <Fade in={open}>
                <StyledModalBox>
                    <Stack spacing={2}>
                        {
                            title &&
                            <Typography id="transition-modal-title" variant="h6" component="h2">
                                {title}
                            </Typography>
                        }
                        {
                            description &&
                            <Typography id="transition-modal-description" sx={{ mt: 2 }}>
                                {description}
                            </Typography>
                        }
                        {children}
                    </Stack>
                </StyledModalBox>
            </Fade>
        </Modal>
    );
}