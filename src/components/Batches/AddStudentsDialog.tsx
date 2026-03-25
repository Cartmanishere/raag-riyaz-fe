"use client";

import * as React from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  FormControl,
  IconButton,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { deriveActorDisplayName } from "@/services/auth-session";
import { User } from "@/types";

function sortUsers(users: User[]) {
  return [...users].sort((left, right) =>
    deriveActorDisplayName(left).localeCompare(deriveActorDisplayName(right))
  );
}

interface AddStudentsDialogProps {
  open: boolean;
  students: User[];
  isSaving?: boolean;
  submitError?: string | null;
  onClose: () => void;
  onSave: (userIds: string[]) => void;
}

export default function AddStudentsDialog({
  open,
  students,
  isSaving = false,
  submitError,
  onClose,
  onSave,
}: AddStudentsDialogProps) {
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [selectionError, setSelectionError] = React.useState<string | null>(null);

  const sortedStudents = React.useMemo(() => sortUsers(students), [students]);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    setSelectedIds([]);
    setSelectionError(null);
  }, [open]);

  const handleSave = () => {
    if (selectedIds.length === 0) {
      setSelectionError("Select at least one student");
      return;
    }

    onSave(selectedIds);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 3,
          py: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="h6" fontWeight={700}>
          Add Students
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: 3, py: 3 }}>
        <Stack spacing={2}>
          {submitError ? <Alert severity="error">{submitError}</Alert> : null}

          {sortedStudents.length === 0 ? (
            <Alert severity="info">All available students are already in this batch.</Alert>
          ) : (
            <FormControl fullWidth error={!!selectionError}>
              <InputLabel id="batch-students-select-label">Students</InputLabel>
              <Select
                labelId="batch-students-select-label"
                multiple
                value={selectedIds}
                onChange={(event) => {
                  setSelectedIds(event.target.value as string[]);
                  if (selectionError) {
                    setSelectionError(null);
                  }
                }}
                input={<OutlinedInput label="Students" />}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                    {(selected as string[]).map((id) => {
                      const student = sortedStudents.find((candidate) => candidate.id === id);
                      const label = student ? deriveActorDisplayName(student) : id;

                      return <Chip key={id} label={label} size="small" />;
                    })}
                  </Box>
                )}
              >
                {sortedStudents.map((student) => (
                  <MenuItem key={student.id} value={student.id}>
                    <Checkbox checked={selectedIds.includes(student.id)} />
                    <ListItemText
                      primary={deriveActorDisplayName(student)}
                      secondary={student.email}
                    />
                  </MenuItem>
                ))}
              </Select>
              {selectionError ? (
                <Typography variant="caption" color="error" sx={{ mt: 0.75 }}>
                  {selectionError}
                </Typography>
              ) : null}
            </FormControl>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isSaving || sortedStudents.length === 0}
        >
          {isSaving ? "Adding..." : "Add Students"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
