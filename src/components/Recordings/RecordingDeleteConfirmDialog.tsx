"use client";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

interface RecordingDeleteConfirmDialogProps {
  open: boolean;
  recordingTitle: string;
  isDeleting: boolean;
  deleteError: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export default function RecordingDeleteConfirmDialog({
  open,
  recordingTitle,
  isDeleting,
  deleteError,
  onClose,
  onConfirm,
}: RecordingDeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={isDeleting ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle fontWeight={700}>Delete Recording?</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          This will permanently remove <strong>{recordingTitle}</strong> and delete its
          attachments and assignments.
        </Typography>
        {deleteError ? (
          <Typography variant="body2" color="error.main" sx={{ mt: 1.5 }}>
            {deleteError}
          </Typography>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" onClick={onClose} disabled={isDeleting}>
          Cancel
        </Button>
        <Button variant="contained" color="error" onClick={onConfirm} disabled={isDeleting}>
          {isDeleting ? "Deleting..." : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
