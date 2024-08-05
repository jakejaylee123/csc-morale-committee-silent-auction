import * as React from "react";

import { Backdrop, Button, ButtonGroup, Fade, Modal, Stack, Typography } from "@mui/material";

import { StyledModalBox } from "./StyledModalBox";
import { UploadFile } from "@mui/icons-material";
import { VisuallyHiddenInput } from "./VisuallyHiddenInput";
import { SerializedNullableEventWithItems } from "~/services/event.server";
import { Form } from "@remix-run/react";

export interface FileUploadModalProps {
    open: boolean,
    event: SerializedNullableEventWithItems,
    title?: string,
    description?: string,
    onClose: (event: {}, reason: "backdropClick" | "escapeKeyDown") => void
};

export function FileUploadModal({
    open,
    event,
    title,
    description,
    onClose
}: FileUploadModalProps) {
    const [file, setFile] = React.useState("");
    const canUpload = !!file;

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
                    <Form 
                        method="post"
                        action={`/admin/events/${event?.id || "invalid"}/items/upload`}
                        encType="multipart/form-data"
                    >
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
                            <ButtonGroup
                                fullWidth
                            >
                                <Button
                                    component="label"
                                    role={undefined}
                                    variant="contained"
                                    tabIndex={-1}
                                >
                                    Choose file...
                                    <VisuallyHiddenInput 
                                        accept="document/csv"
                                        type="file"
                                        value={file}
                                        name="uploadFile"
                                        onChange={(e) => {
                                            console.log(e);
                                            setFile(e.target.value);
                                        }} />
                                </Button>
                                <Button
                                    type="submit"
                                    color="primary"
                                    disabled={!canUpload}
                                    startIcon={<UploadFile />}
                                >
                                    Upload
                                </Button>
                            </ButtonGroup>
                        </Stack>
                    </Form>
                </StyledModalBox>
            </Fade>
        </Modal>
    );
}