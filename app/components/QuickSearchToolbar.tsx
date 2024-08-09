import { Checkbox, FormControlLabel, Stack } from '@mui/material';
import { Box } from '@mui/material';
import { GridToolbarProps, GridToolbarQuickFilter } from '@mui/x-data-grid'

export interface QuickSearchFilterCheckbox {
    label: string,
    value: boolean,
    checked: boolean,
    onInput: React.FormEventHandler<HTMLButtonElement>
};

export interface QuickSearchToolbarProps extends GridToolbarProps {
    withFilterCheckboxes?: QuickSearchFilterCheckbox[]
};

export function QuickSearchToolbar({ withFilterCheckboxes }: QuickSearchToolbarProps) {
    return (
        <Box
            sx={{
                p: 0.5,
                pb: 0,
            }}
        >
            <Stack 
                spacing={2} 
                direction="row"
            >
                <GridToolbarQuickFilter />
                {
                    withFilterCheckboxes?.map(checkbox => (
                        <FormControlLabel
                            key={checkbox.label}
                            control={
                                <Checkbox
                                    value={checkbox.value}
                                    checked={checkbox.checked}
                                    onInput={checkbox.onInput}
                                />
                            }
                            label={checkbox.label}
                        />
                    ))
                }
            </Stack>
        </Box>
    );
}