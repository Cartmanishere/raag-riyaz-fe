"use client";

import * as React from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export interface BatchFormValues {
  name: string;
}

interface BatchFormDialogProps {
  open: boolean;
  isSaving?: boolean;
  submitError?: string | null;
  onClose: () => void;
  onSave: (values: BatchFormValues) => void;
}

export default function BatchFormDialog({
  open,
  isSaving = false,
  submitError,
  onClose,
  onSave,
}: BatchFormDialogProps) {
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    setName("");
    setError(null);
  }, [open]);

  const handleSave = () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Batch name is required");
      return;
    }

    onSave({ name: trimmedName });
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
          Add Batch
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: 3, py: 3 }}>
        {submitError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        ) : null}

        <TextField
          autoFocus
          label="Batch Name"
          fullWidth
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (error) {
              setError(null);
            }
          }}
          error={!!error}
          helperText={error ?? "Use a unique name for this batch"}
          disabled={isSaving}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleSave();
            }
          }}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Creating..." : "Create Batch"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
