import {
    useState
} from "react";
import { Form } from "react-router";

import Backdrop from "@mui/material/Backdrop";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import Fade from "@mui/material/Fade";
import Modal from "@mui/material/Modal";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import UploadFile from "@mui/icons-material/UploadFile";

import { EventWithItems } from "~/services/event.server";

import { StyledModalBox } from "./StyledModalBox";
import { VisuallyHiddenInput } from "./VisuallyHiddenInput";
import { Dto } from "~/commons/general.common";

export type FileUploadModalProps = {
    open: boolean,
    event: Dto<EventWithItems | null>,
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
    const [file, setFile] = useState("");
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