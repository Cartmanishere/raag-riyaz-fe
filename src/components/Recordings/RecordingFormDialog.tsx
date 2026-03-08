"use client";

import * as React from "react";
import {
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
import { Recording } from "@/data/seed";

interface FormValues {
  title: string;
  raag: string;
  taal: string;
  notes: string;
  fileName: string;
}

interface RecordingFormDialogProps {
  open: boolean;
  mode: "add" | "edit";
  recording?: Recording;
  onClose: () => void;
  onSave: (values: FormValues) => void;
}

const empty: FormValues = { title: "", raag: "", taal: "", notes: "", fileName: "" };

export default function RecordingFormDialog({
  open,
  mode,
  recording,
  onClose,
  onSave,
}: RecordingFormDialogProps) {
  const [form, setForm] = React.useState<FormValues>(empty);
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormValues, string>>>({});
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      if (mode === "edit" && recording) {
        setForm({
          title: recording.title,
          raag: recording.raag,
          taal: recording.taal ?? "",
          notes: recording.notes,
          fileName: "",
        });
      } else {
        setForm(empty);
      }
      setErrors({});
    }
  }, [open, mode, recording]);

  const validate = () => {
    const e: Partial<Record<keyof FormValues, string>> = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.raag.trim()) e.raag = "Raag is required";
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave(form);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setForm((f) => ({ ...f, fileName: file.name }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <Typography variant="h6" fontWeight={700}>
          {mode === "add" ? "Upload Recording" : "Edit Recording"}
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: "16px !important" }}>
        <TextField
          label="Title"
          fullWidth
          required
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          error={!!errors.title}
          helperText={errors.title}
        />
        <TextField
          label="Raag"
          fullWidth
          required
          value={form.raag}
          onChange={(e) => setForm((f) => ({ ...f, raag: e.target.value }))}
          error={!!errors.raag}
          helperText={errors.raag}
        />
        <TextField
          label="Taal (optional)"
          fullWidth
          value={form.taal}
          onChange={(e) => setForm((f) => ({ ...f, taal: e.target.value }))}
        />
        <TextField
          label="Notes / Instructions"
          fullWidth
          multiline
          rows={3}
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        />

        {/* File upload area */}
        <Box
          onClick={() => fileInputRef.current?.click()}
          sx={{
            border: "2px dashed",
            borderColor: "divider",
            borderRadius: 2,
            py: 3,
            textAlign: "center",
            cursor: "pointer",
            "&:hover": { borderColor: "primary.main", backgroundColor: "action.hover" },
          }}
        >
          <AttachFileIcon sx={{ color: "text.disabled", mb: 0.5 }} />
          <Typography variant="body2" color="text.secondary">
            {form.fileName ? form.fileName : "Drop audio file or click to select"}
          </Typography>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            hidden
            onChange={handleFileChange}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave}>Save Recording</Button>
      </DialogActions>
    </Dialog>
  );
}
