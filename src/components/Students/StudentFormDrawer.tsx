"use client";

import * as React from "react";
import {
  Box,
  Button,
  Divider,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  TextField,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Student } from "@/data/seed";

type Level = "Beginner" | "Intermediate" | "Advanced";
type Status = "Active" | "Inactive";

interface FormValues {
  name: string;
  email: string;
  status: Status;
  level: Level;
}

interface StudentFormDrawerProps {
  open: boolean;
  mode: "add" | "edit";
  student?: Student;
  onClose: () => void;
  onSave: (values: FormValues) => void;
}

const empty: FormValues = {
  name: "",
  email: "",
  status: "Active",
  level: "Beginner",
};

export default function StudentFormDrawer({
  open,
  mode,
  student,
  onClose,
  onSave,
}: StudentFormDrawerProps) {
  const [form, setForm] = React.useState<FormValues>(empty);
  const [errors, setErrors] = React.useState<Partial<FormValues>>({});

  // Sync form when drawer opens
  React.useEffect(() => {
    if (open) {
      if (mode === "edit" && student) {
        setForm({
          name: student.name,
          email: student.email,
          status: student.status,
          level: student.level,
        });
      } else {
        setForm(empty);
      }
      setErrors({});
    }
  }, [open, mode, student]);

  const validate = () => {
    const e: Partial<FormValues> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave(form);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: "100%", sm: 400 }, p: 0 } }}
    >
      {/* Header */}
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
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Form */}
      <Box sx={{ px: 3, py: 3, display: "flex", flexDirection: "column", gap: 3 }}>
        <TextField
          label="Name"
          fullWidth
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          error={!!errors.name}
          helperText={errors.name}
          required
        />

        <TextField
          label="Email"
          fullWidth
          type="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          error={!!errors.email}
          helperText={errors.email}
          required
        />

        {/* Status toggle */}
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
            Status
          </Typography>
          <ToggleButtonGroup
            exclusive
            value={form.status}
            onChange={(_, v) => { if (v) setForm((f) => ({ ...f, status: v })); }}
            size="small"
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
            <ToggleButton value="Active">Active</ToggleButton>
            <ToggleButton value="Inactive">Inactive</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Level select */}
        <FormControl fullWidth>
          <InputLabel>Level</InputLabel>
          <Select
            value={form.level}
            label="Level"
            onChange={(e) => setForm((f) => ({ ...f, level: e.target.value as Level }))}
          >
            <MenuItem value="Beginner">Beginner</MenuItem>
            <MenuItem value="Intermediate">Intermediate</MenuItem>
            <MenuItem value="Advanced">Advanced</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Divider />

      {/* Footer actions */}
      <Stack direction="row" spacing={2} sx={{ px: 3, py: 2, justifyContent: "flex-end" }}>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave}>
          Save
        </Button>
      </Stack>
    </Drawer>
  );
}
