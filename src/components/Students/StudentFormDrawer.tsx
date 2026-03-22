"use client";

import * as React from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  Divider,
  IconButton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { User } from "@/types";

export type StudentStatus = "active" | "inactive";

export interface StudentFormValues {
  displayName: string;
  email: string;
  phone: string;
  status: StudentStatus;
  password: string;
}

interface StudentFormDrawerProps {
  open: boolean;
  mode: "add" | "edit";
  student?: User;
  isSaving?: boolean;
  submitError?: string | null;
  onClose: () => void;
  onSave: (values: StudentFormValues) => void;
}

const empty: StudentFormValues = {
  displayName: "",
  email: "",
  phone: "",
  status: "active",
  password: "",
};

type FormErrors = Partial<Record<keyof StudentFormValues, string>>;

function formatStatusLabel(status: StudentStatus) {
  return status === "active" ? "Active" : "Inactive";
}

function getInitialFormValues(mode: "add" | "edit", student?: User): StudentFormValues {
  if (mode === "edit" && student) {
    return {
      displayName: student.displayName ?? "",
      email: student.email,
      phone: student.phone ?? "",
      status: student.status.toLowerCase() === "inactive" ? "inactive" : "active",
      password: "",
    };
  }

  return empty;
}

export default function StudentFormDrawer({
  open,
  mode,
  student,
  isSaving = false,
  submitError,
  onClose,
  onSave,
}: StudentFormDrawerProps) {
  const [form, setForm] = React.useState<StudentFormValues>(empty);
  const [errors, setErrors] = React.useState<FormErrors>({});

  React.useEffect(() => {
    if (!open) {
      return;
    }

    setForm(getInitialFormValues(mode, student));
    setErrors({});
  }, [open, mode, student]);

  const validate = () => {
    const nextErrors: FormErrors = {};

    if (!form.displayName.trim()) {
      nextErrors.displayName = "Name is required";
    }

    if (!form.email.trim()) {
      nextErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email address";
    }

    if (mode === "add" && !form.password.trim()) {
      nextErrors.password = "Password is required";
    }

    return nextErrors;
  };

  const handleSave = () => {
    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSave({
      ...form,
      displayName: form.displayName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      password: form.password.trim(),
    });
  };

  return (
    <Dialog
      open={open}
      onClose={isSaving ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      scroll="paper"
      PaperProps={{
        sx: {
          width: "100%",
          maxHeight: "min(88vh, 820px)",
          borderRadius: 3,
          p: 0,
        },
      }}
    >
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
          {mode === "add" ? "Add Student" : "Edit Student"}
        </Typography>
        <IconButton onClick={onClose} size="small" disabled={isSaving}>
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent
        dividers
        sx={{ px: 3, py: 3, display: "flex", flexDirection: "column", gap: 3 }}
      >
        {submitError ? <Alert severity="error">{submitError}</Alert> : null}

        <TextField
          label="Name"
          fullWidth
          value={form.displayName}
          onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
          error={!!errors.displayName}
          helperText={errors.displayName}
          required
          disabled={isSaving}
        />

        <TextField
          label="Email"
          fullWidth
          type="email"
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          error={!!errors.email}
          helperText={errors.email}
          required
          disabled={isSaving}
        />

        <TextField
          label="Phone"
          fullWidth
          value={form.phone}
          onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
          helperText="Optional"
          disabled={isSaving}
        />

        <TextField
          label={mode === "add" ? "Password" : "Password (leave blank to keep current)"}
          fullWidth
          type="password"
          value={form.password}
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          error={!!errors.password}
          helperText={errors.password ?? (mode === "add" ? undefined : "Optional")}
          required={mode === "add"}
          disabled={isSaving}
        />

        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
            Status
          </Typography>
          <ToggleButtonGroup
            exclusive
            value={form.status}
            onChange={(_, value: StudentStatus | null) => {
              if (value) {
                setForm((current) => ({ ...current, status: value }));
              }
            }}
            size="small"
            disabled={isSaving}
            sx={{
              "& .MuiToggleButton-root": {
                px: 3,
                textTransform: "none",
                fontWeight: 600,
                "&.Mui-selected": {
                  backgroundColor: "primary.main",
                  color: "primary.contrastText",
                  "&:hover": { backgroundColor: "primary.dark" },
                },
              },
            }}
          >
            <ToggleButton value="active">{formatStatusLabel("active")}</ToggleButton>
            <ToggleButton value="inactive">{formatStatusLabel("inactive")}</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </DialogContent>

      <Divider />

      <Stack direction="row" spacing={2} sx={{ px: 3, py: 2, justifyContent: "flex-end" }}>
        <Button variant="outlined" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : mode === "add" ? "Create Student" : "Save Changes"}
        </Button>
      </Stack>
    </Dialog>
  );
}
