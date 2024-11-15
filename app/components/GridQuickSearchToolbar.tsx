import {
    Checkbox,
    FormControlLabel,
    Stack,
    Box
} from "@mui/material";

import { 
    GridFilterItem, 
    GridToolbarProps, 
    GridToolbarQuickFilter 
} from "@mui/x-data-grid";

export type GridQuickSearchFilterCheckboxState = {
    apply: boolean,
    filter: Omit<GridFilterItem, "id" | "label"> & {
        id: string,
        label: string
    }
};
export type GridQuickSearchFilterCheckboxStates = { [id: string]: GridQuickSearchFilterCheckboxState };

export interface GridQuickSearchFilterCheckbox {
    id: string,
    label: string,
    value: boolean,
    checked: boolean,
    onInput: React.FormEventHandler<HTMLButtonElement>
};

export interface GridQuickSearchToolbarProps extends GridToolbarProps {
    withFilterCheckboxes?: GridQuickSearchFilterCheckbox[]
};

export function GridQuickSearchToolbar({ withFilterCheckboxes }: GridQuickSearchToolbarProps) {
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
                    withFilterCheckboxes?.map((checkbox, index) => (
                        <FormControlLabel
                            key={`filter-check-box-${index}`}
                            control={
                                <Checkbox
                                    id={checkbox.id}
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