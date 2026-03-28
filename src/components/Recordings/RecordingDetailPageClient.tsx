"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { adminRecordingsApi } from "@/services/api";
import { ApiError, Recording } from "@/types";
import AttachmentsSection from "./AttachmentsSection";
import BulkAssignRecordingsDialog, {
  BulkAssignTarget,
} from "./BulkAssignRecordingsDialog";
import RecordingDeleteConfirmDialog from "./RecordingDeleteConfirmDialog";
import RecordingPlaybackCard from "./RecordingPlaybackCard";

interface RecordingDetailPageClientProps {
  id: string;
}

interface RecordingFormState {
  title: string;
  raag: string;
  taal: string;
  notes: string;
}

const emptyFormState: RecordingFormState = {
  title: "",
  raag: "",
  taal: "",
  notes: "",
};

function toFormState(recording: Recording): RecordingFormState {
  return {
    title: recording.title,
    raag: recording.raag ?? "",
    taal: recording.taal ?? "",
    notes: recording.notes ?? "",
  };
}

function toErrorMessage(error: ApiError | null, fallback: string) {
  return error?.message ?? fallback;
}

function isNotFoundError(error: ApiError | null) {
  return error?.statusCode === 404;
}

export default function RecordingDetailPageClient({
  id,
}: RecordingDetailPageClientProps) {
  const router = useRouter();
  const [recording, setRecording] = React.useState<Recording | null>(null);
  const [form, setForm] = React.useState<RecordingFormState>(emptyFormState);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<ApiError | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = React.useState<string | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = React.useState(false);
  const [isAssigning, setIsAssigning] = React.useState(false);
  const [assignmentFeedback, setAssignmentFeedback] = React.useState<{
    severity: "success" | "warning" | "error";
    message: string;
  } | null>(null);

  const loadRecording = React.useCallback(async () => {
    if (!id.trim()) {
      setRecording(null);
      setForm(emptyFormState);
      setError({
        message: "Invalid recording ID.",
        statusCode: 404,
      });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const nextRecording = await adminRecordingsApi.getById(id);
      setRecording(nextRecording);
      setForm(toFormState(nextRecording));
    } catch (err) {
      const apiError = err as ApiError;
      setRecording(null);
      setForm(emptyFormState);
      setError({
        code: apiError?.code,
        message: apiError?.message ?? "Failed to load recording.",
        statusCode: apiError?.statusCode ?? 500,
      });
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    void loadRecording();
  }, [loadRecording]);

  const isDirty = React.useMemo(() => {
    if (!recording) {
      return false;
    }

    return JSON.stringify(form) !== JSON.stringify(toFormState(recording));
  }, [form, recording]);

  const handleFieldChange =
    (field: keyof RecordingFormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setForm((current) => ({ ...current, [field]: value }));
      setSaveSuccessMessage(null);
      setSubmitError(null);
    };

  const handleSave = async () => {
    if (!recording) {
      return;
    }

    if (!form.title.trim()) {
      setSubmitError("Recording title is required.");
      setSaveSuccessMessage(null);
      return;
    }

    setIsSaving(true);
    setSubmitError(null);
    setSaveSuccessMessage(null);

    try {
      const updatedRecording = await adminRecordingsApi.update(recording.id, {
        title: form.title.trim(),
        raag: form.raag.trim() || null,
        taal: form.taal.trim() || null,
        notes: form.notes.trim() || null,
      });

      setRecording(updatedRecording);
      setForm(toFormState(updatedRecording));
      setSaveSuccessMessage("Recording details updated.");
    } catch (err) {
      const apiError = err as ApiError;
      setSubmitError(toErrorMessage(apiError, "Failed to update recording."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssign = async (target: BulkAssignTarget) => {
    if (!recording) {
      return;
    }

    setIsAssigning(true);
    setAssignmentFeedback(null);

    try {
      if (target.type === "batch") {
        await adminRecordingsApi.assignBatch(recording.id, {
          batchId: target.targetId,
        });
      } else {
        await adminRecordingsApi.assign(recording.id, {
          assignedToUserId: target.targetId,
        });
      }

      setAssignmentFeedback({ severity: "success", message: `Assigned to ${target.targetLabel}.` });
      setIsAssignDialogOpen(false);
    } catch (err) {
      const apiError = err as ApiError;
      const isConflict = apiError?.statusCode === 409;

      setAssignmentFeedback({
        severity: isConflict ? "warning" : "error",
        message: isConflict
          ? `This recording is already assigned to ${target.targetLabel}.`
          : toErrorMessage(apiError, "Unable to assign this recording."),
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleDelete = async () => {
    if (!recording) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await adminRecordingsApi.delete(recording.id);
      router.push("/teacher-dashboard/recordings");
    } catch (err) {
      const apiError = err as ApiError;
      setDeleteError(toErrorMessage(apiError, "Failed to delete recording."));
    } finally {
      setIsDeleting(false);
    }
  };

  const backLink = (
    <Link href="/teacher-dashboard/recordings" style={{ textDecoration: "none" }}>
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
          color: "text.secondary",
          "&:hover": { color: "primary.main" },
        }}
      >
        <ArrowBackIcon fontSize="small" />
        <Typography variant="body2">Back to Recordings</Typography>
      </Box>
    </Link>
  );

  if (isLoading) {
    return (
      <Box>
        <Box sx={{ mb: 3 }}>{backLink}</Box>
        <Card>
          <CardContent sx={{ py: 8, textAlign: "center" }}>
            <CircularProgress size={28} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Loading recording details...
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (error && isNotFoundError(error)) {
    return (
      <Box>
        <Box sx={{ mb: 3 }}>{backLink}</Box>
        <Card>
          <CardContent sx={{ py: 6 }}>
            <Stack spacing={1.5}>
              <Typography variant="h6" fontWeight={700}>
                Recording not found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {error.message}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (error || !recording) {
    return (
      <Box>
        <Box sx={{ mb: 3 }}>{backLink}</Box>
        <Card>
          <CardContent sx={{ py: 6 }}>
            <Stack spacing={1.5}>
              <Typography variant="h6" fontWeight={700}>
                Unable to load recording
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {error?.message ?? "An unexpected error occurred."}
              </Typography>
              <Box>
                <Button variant="outlined" onClick={() => void loadRecording()}>
                  Retry
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "grid", gap: 3 }}>
      <Box>{backLink}</Box>

      <Card>
        <CardContent
          sx={{
            display: "flex",
            gap: 2,
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", md: "center" },
            flexDirection: { xs: "column", md: "row" },
          }}
        >
          <Stack spacing={2} sx={{ minWidth: 0, width: "100%", maxWidth: 520 }}>
            <Typography variant="h4" fontWeight={700}>
              {recording.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              Manage the recording metadata, attachments, and assignment from one screen.
            </Typography>
            <RecordingPlaybackCard recordingId={recording.id} />
          </Stack>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{ width: { xs: "100%", md: "auto" }, alignSelf: { xs: "stretch", md: "flex-start" } }}
          >
            <Button
              variant="contained"
              onClick={() => setIsAssignDialogOpen(true)}
              disabled={isAssigning}
            >
              {isAssigning ? "Assigning..." : "Assign Recording"}
            </Button>
            <Button
              color="error"
              variant="outlined"
              startIcon={<DeleteOutlineIcon />}
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              Delete Recording
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1.5fr) minmax(320px, 1fr)" },
          alignItems: "start",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) minmax(0, 1fr)" },
            alignItems: "start",
          }}
        >
          <Card>
            <CardContent sx={{ display: "grid", gap: 2.5 }}>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Recording Details
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Update the recording title, raag, taal, and notes.
                </Typography>
              </Box>

              {submitError ? <Alert severity="error">{submitError}</Alert> : null}
              {saveSuccessMessage ? <Alert severity="success">{saveSuccessMessage}</Alert> : null}

              <TextField
                label="Recording Name"
                value={form.title}
                onChange={handleFieldChange("title")}
                disabled={isSaving}
                required
                fullWidth
              />
              <TextField
                label="Raag"
                value={form.raag}
                onChange={handleFieldChange("raag")}
                disabled={isSaving}
                fullWidth
              />
              <TextField
                label="Taal"
                value={form.taal}
                onChange={handleFieldChange("taal")}
                disabled={isSaving}
                fullWidth
              />
              <TextField
                label="Notes / Instructions"
                value={form.notes}
                onChange={handleFieldChange("notes")}
                disabled={isSaving}
                fullWidth
                multiline
                minRows={4}
              />

              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  variant="contained"
                  startIcon={isSaving ? <CircularProgress color="inherit" size={16} /> : <SaveOutlinedIcon />}
                  onClick={() => void handleSave()}
                  disabled={isSaving || !isDirty}
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent sx={{ display: "grid", gap: 2 }}>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Attachments
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Add supporting images or PDFs for this recording.
                </Typography>
              </Box>
              <AttachmentsSection recordingId={recording.id} />
            </CardContent>
          </Card>
        </Box>

        {assignmentFeedback ? (
          <Alert severity={assignmentFeedback.severity}>
            {assignmentFeedback.message}
          </Alert>
        ) : null}
      </Box>

      <RecordingDeleteConfirmDialog
        open={isDeleteDialogOpen}
        recordingTitle={recording.title}
        isDeleting={isDeleting}
        deleteError={deleteError}
        onClose={() => {
          if (!isDeleting) {
            setIsDeleteDialogOpen(false);
            setDeleteError(null);
          }
        }}
        onConfirm={() => {
          void handleDelete();
        }}
      />

      <BulkAssignRecordingsDialog
        open={isAssignDialogOpen}
        selectedCount={1}
        isSubmitting={isAssigning}
        submitError={null}
        onClose={() => {
          if (!isAssigning) {
            setIsAssignDialogOpen(false);
          }
        }}
        onAssign={(target) => {
          void handleAssign(target);
        }}
      />
    </Box>
  );
}
