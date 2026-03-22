"use client";

import * as React from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import { Recording } from "@/types";

export interface RecordingFormValues {
  title: string;
  raag: string;
  taal: string;
  notes: string;
  file: File | null;
}

interface RecordingFormDialogProps {
  open: boolean;
  mode: "add" | "edit";
  recording?: Recording;
  isSaving: boolean;
  submitError: string | null;
  onClose: () => void;
  onSave: (values: RecordingFormValues) => void;
}

const empty: RecordingFormValues = {
  title: "",
  raag: "",
  taal: "",
  notes: "",
  file: null,
};

export default function RecordingFormDialog({
  open,
  mode,
  recording,
  isSaving,
  submitError,
  onClose,
  onSave,
}: RecordingFormDialogProps) {
  const [form, setForm] = React.useState<RecordingFormValues>(empty);
  const [errors, setErrors] = React.useState<
    Partial<Record<keyof RecordingFormValues, string>>
  >({});
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      if (mode === "edit" && recording) {
        setForm({
          title: recording.title,
          raag: recording.raag ?? "",
          taal: recording.taal ?? "",
          notes: recording.notes ?? "",
          file: null,
        });
      } else {
        setForm(empty);
      }
      setErrors({});
    }
  }, [open, mode, recording]);

  const validate = () => {
    const e: Partial<Record<keyof RecordingFormValues, string>> = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (mode === "add" && !form.file) e.file = "Audio file is required";
    if (form.file && form.file.type && !form.file.type.startsWith("audio/")) {
      e.file = "Selected file must be an audio file";
    }
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    onSave(form);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setForm((f) => ({ ...f, file: file ?? null }));
    setErrors((current) => ({ ...current, file: undefined }));
  };

  return (
    <Dialog open={open} onClose={isSaving ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <Typography variant="h6" fontWeight={700} component="div">
          {mode === "add" ? "Upload Recording" : "Edit Recording"}
        </Typography>
        <IconButton size="small" onClick={onClose} disabled={isSaving}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: "16px !important" }}>
        {submitError ? <Alert severity="error">{submitError}</Alert> : null}

        <TextField
          label="Title"
          fullWidth
          required
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          error={!!errors.title}
          helperText={errors.title}
          disabled={isSaving}
        />
        <TextField
          label="Raag (optional)"
          fullWidth
          value={form.raag}
          onChange={(e) => setForm((f) => ({ ...f, raag: e.target.value }))}
          error={!!errors.raag}
          helperText={errors.raag}
          disabled={isSaving}
        />
        <TextField
          label="Taal (optional)"
          fullWidth
          value={form.taal}
          onChange={(e) => setForm((f) => ({ ...f, taal: e.target.value }))}
          disabled={isSaving}
        />
        <TextField
          label="Notes / Instructions"
          fullWidth
          multiline
          rows={3}
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          disabled={isSaving}
        />

        {mode === "add" ? (
          <Box>
            <Box
              onClick={() => {
                if (!isSaving) {
                  fileInputRef.current?.click();
                }
              }}
              sx={{
                border: "2px dashed",
                borderColor: errors.file ? "error.main" : "divider",
                borderRadius: 2,
                py: 3,
                textAlign: "center",
                cursor: isSaving ? "default" : "pointer",
                backgroundColor: isSaving ? "action.disabledBackground" : "transparent",
                "&:hover": isSaving
                  ? undefined
                  : { borderColor: "primary.main", backgroundColor: "action.hover" },
              }}
            >
              <AttachFileIcon sx={{ color: "text.disabled", mb: 0.5 }} />
              <Typography variant="body2" color="text.secondary">
                {form.file ? form.file.name : "Drop audio file or click to select"}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                Supported by backend as multipart upload
              </Typography>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                hidden
                onChange={handleFileChange}
                disabled={isSaving}
              />
            </Box>
            {errors.file ? (
              <Typography variant="caption" color="error" sx={{ mt: 0.75, display: "block" }}>
                {errors.file}
              </Typography>
            ) : null}
          </Box>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : mode === "add" ? "Upload Recording" : "Save Recording"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
