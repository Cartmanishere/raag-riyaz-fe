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
  LinearProgress,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { Recording, RecordingAttachmentType } from "@/types";

export interface RecordingFormValues {
  title: string;
  raag: string;
  taal: string;
  notes: string;
  file: File | null;
  attachments: File[];
}

export function inferAttachmentType(file: File): RecordingAttachmentType | null {
  if (file.type.startsWith("image/")) {
    return "image";
  }
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    return "pdf";
  }
  return null;
}

interface RecordingFormDialogProps {
  open: boolean;
  mode: "add" | "edit";
  recording?: Recording;
  isSaving: boolean;
  isUploadingAttachments?: boolean;
  submitError: string | null;
  onClose: () => void;
  onSave: (values: RecordingFormValues) => void;
  uploadProgress?: number | null;
  uploadProgressThresholdBytes?: number;
}

const empty: RecordingFormValues = {
  title: "",
  raag: "",
  taal: "",
  notes: "",
  file: null,
  attachments: [],
};

const AUDIO_FILE_ACCEPT =
  ".mp3,.wav,.m4a,.mp4,.aac,.ogg,.oga,.flac,audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/mp4,audio/aac,audio/ogg,audio/flac,video/mp4,audio/*";

const ATTACHMENT_FILE_ACCEPT = "image/*,application/pdf";
const MAX_IMAGE_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

function isAudioFile(file: File) {
  if (file.type.startsWith("audio/")) {
    return true;
  }

  // Browsers report .mp4 as video/mp4, but audio-only MP4s (e.g. WhatsApp
  // voice notes) are common. Treat .mp4 as a valid audio file.
  if (
    file.type === "video/mp4" ||
    /\.(mp3|wav|m4a|aac|ogg|oga|flac|mp4)$/i.test(file.name)
  ) {
    return true;
  }

  return false;
}

const DEFAULT_UPLOAD_PROGRESS_THRESHOLD_BYTES = 5 * 1024 * 1024; // 5 MB

export default function RecordingFormDialog({
  open,
  mode,
  recording,
  isSaving,
  isUploadingAttachments = false,
  submitError,
  onClose,
  onSave,
  uploadProgress,
  uploadProgressThresholdBytes = DEFAULT_UPLOAD_PROGRESS_THRESHOLD_BYTES,
}: RecordingFormDialogProps) {
  const [form, setForm] = React.useState<RecordingFormValues>(empty);
  const [errors, setErrors] = React.useState<
    Partial<Record<keyof RecordingFormValues, string>>
  >({});
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const attachmentInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      if (mode === "edit" && recording) {
        setForm({
          title: recording.title,
          raag: recording.raag ?? "",
          taal: recording.taal ?? "",
          notes: recording.notes ?? "",
          file: null,
          attachments: [],
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
    if (form.file && !isAudioFile(form.file)) {
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

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);
    const valid = selectedFiles.filter(
      (f) => inferAttachmentType(f) !== null && !(inferAttachmentType(f) === "image" && f.size > MAX_IMAGE_FILE_SIZE_BYTES)
    );
    setForm((f) => ({ ...f, attachments: [...f.attachments, ...valid] }));
    setErrors((current) => ({ ...current, attachments: undefined }));
  };

  const handleRemoveAttachment = (index: number) => {
    setForm((f) => ({
      ...f,
      attachments: f.attachments.filter((_, i) => i !== index),
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <Typography variant="h6" fontWeight={700} component="div">
          {mode === "add" ? "Upload Recording" : "Edit Recording"}
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: "16px !important" }}>
        {submitError ? <Alert severity="error">{submitError}</Alert> : null}
        {isUploadingAttachments ? (
          <Alert severity="info">Recording saved. Uploading attachments...</Alert>
        ) : null}

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
                accept={AUDIO_FILE_ACCEPT}
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

            {form.file &&
            form.file.size > uploadProgressThresholdBytes &&
            uploadProgress != null &&
            uploadProgress > 0 ? (
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Uploading...
                  </Typography>
                  <Typography variant="caption" fontWeight={600}>
                    {uploadProgress}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={uploadProgress}
                  sx={{ height: 6, borderRadius: 1 }}
                />
              </Box>
            ) : null}
          </Box>
        ) : null}

        {mode === "add" ? (
          <Box>
            <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
              Attachments (optional)
            </Typography>
            <Box
              onClick={() => {
                if (!isSaving) {
                  attachmentInputRef.current?.click();
                }
              }}
              sx={{
                border: "2px dashed",
                borderColor: "divider",
                borderRadius: 2,
                py: 2,
                textAlign: "center",
                cursor: isSaving ? "default" : "pointer",
                backgroundColor: isSaving ? "action.disabledBackground" : "transparent",
                "&:hover": isSaving
                  ? undefined
                  : { borderColor: "primary.main", backgroundColor: "action.hover" },
              }}
            >
              <AddPhotoAlternateIcon sx={{ color: "text.disabled", mb: 0.5 }} />
              <Typography variant="body2" color="text.secondary">
                Add images or PDFs
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                Images up to 5 MB each
              </Typography>
              <input
                ref={attachmentInputRef}
                type="file"
                multiple
                accept={ATTACHMENT_FILE_ACCEPT}
                hidden
                onChange={handleAttachmentChange}
                disabled={isSaving}
              />
            </Box>

            {form.attachments.map((file, index) => (
              <Box
                key={`${file.name}-${index}`}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mt: 1,
                  px: 1.5,
                  py: 0.75,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  backgroundColor: "background.paper",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                  {inferAttachmentType(file) === "pdf" ? (
                    <PictureAsPdfIcon fontSize="small" sx={{ color: "error.main", flexShrink: 0 }} />
                  ) : (
                    <AddPhotoAlternateIcon fontSize="small" sx={{ color: "text.secondary", flexShrink: 0 }} />
                  )}
                  <Typography
                    variant="body2"
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {file.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                    {file.size < 1024 * 1024
                      ? `${Math.round(file.size / 1024)} KB`
                      : `${(file.size / (1024 * 1024)).toFixed(1)} MB`}
                  </Typography>
                </Box>
                <IconButton size="small" onClick={() => handleRemoveAttachment(index)} disabled={isSaving}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={isSaving}>
          {isUploadingAttachments
            ? "Uploading attachments..."
            : isSaving
              ? "Saving..."
              : mode === "add"
                ? "Upload Recording"
                : "Save Recording"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
