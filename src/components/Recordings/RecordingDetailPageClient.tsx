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
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { deriveActorDisplayName } from "@/services/auth-session";
import { adminRecordingsApi, adminUsersApi } from "@/services/api";
import { ApiError, Recording, User } from "@/types";
import AttachmentsSection from "./AttachmentsSection";
import RecordingDeleteConfirmDialog from "./RecordingDeleteConfirmDialog";

const USER_ROLE = "user";

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

function sortUsers(users: User[]) {
  return [...users].sort((left, right) =>
    deriveActorDisplayName(left).localeCompare(deriveActorDisplayName(right))
  );
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

  const [assignees, setAssignees] = React.useState<User[]>([]);
  const [isAssigneesLoading, setIsAssigneesLoading] = React.useState(true);
  const [assigneesError, setAssigneesError] = React.useState<string | null>(null);
  const [selectedAssigneeId, setSelectedAssigneeId] = React.useState("");
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

  const loadAssignees = React.useCallback(async () => {
    setIsAssigneesLoading(true);
    setAssigneesError(null);

    try {
      const users = await adminUsersApi.list();
      const eligibleUsers = sortUsers(
        users.filter((user) => user.role.toLowerCase() === USER_ROLE)
      );

      setAssignees(eligibleUsers);
      setSelectedAssigneeId((current) =>
        current && eligibleUsers.some((user) => user.id === current)
          ? current
          : eligibleUsers[0]?.id ?? ""
      );
    } catch (err) {
      const apiError = err as ApiError;
      setAssignees([]);
      setSelectedAssigneeId("");
      setAssigneesError(
        toErrorMessage(apiError, "Unable to load users for assignment.")
      );
    } finally {
      setIsAssigneesLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadRecording();
  }, [loadRecording]);

  React.useEffect(() => {
    void loadAssignees();
  }, [loadAssignees]);

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

  const handleAssign = async () => {
    if (!recording || !selectedAssigneeId) {
      return;
    }

    setIsAssigning(true);
    setAssignmentFeedback(null);

    try {
      const assignment = await adminRecordingsApi.assign(recording.id, {
        assignedToUserId: selectedAssigneeId,
      });
      const assignedUser = assignees.find((user) => user.id === assignment.assignedToUserId);

      setAssignmentFeedback({
        severity: "success",
        message: assignedUser
          ? `Assigned to ${deriveActorDisplayName(assignedUser)}.`
          : "Recording assigned successfully.",
      });
    } catch (err) {
      const apiError = err as ApiError;
      const isConflict = apiError?.statusCode === 409;

      setAssignmentFeedback({
        severity: isConflict ? "warning" : "error",
        message: isConflict
          ? "This recording is already assigned to the selected student."
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
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h4" fontWeight={700}>
              {recording.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              Manage the recording metadata, attachments, and assignment from one screen.
            </Typography>
          </Box>
          <Button
            color="error"
            variant="outlined"
            startIcon={<DeleteOutlineIcon />}
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            Delete Recording
          </Button>
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
        <Stack spacing={3}>
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
        </Stack>

        <Stack spacing={3}>
          <Card>
            <CardContent sx={{ display: "grid", gap: 2 }}>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Assignment
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Assign this recording to a student from the same screen.
                </Typography>
              </Box>

              {assignmentFeedback ? (
                <Alert severity={assignmentFeedback.severity}>
                  {assignmentFeedback.message}
                </Alert>
              ) : null}

              {isAssigneesLoading ? (
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <CircularProgress size={20} />
                  <Typography variant="body2" color="text.secondary">
                    Loading students...
                  </Typography>
                </Stack>
              ) : assigneesError ? (
                <Stack spacing={1}>
                  <Alert severity="error">{assigneesError}</Alert>
                  <Box>
                    <Button variant="outlined" size="small" onClick={() => void loadAssignees()}>
                      Retry
                    </Button>
                  </Box>
                </Stack>
              ) : assignees.length === 0 ? (
                <Alert severity="info">
                  No student accounts are available for assignment.
                </Alert>
              ) : (
                <>
                  <FormControl fullWidth>
                    <InputLabel id="recording-assignee-label">Assign to</InputLabel>
                    <Select
                      labelId="recording-assignee-label"
                      label="Assign to"
                      value={selectedAssigneeId}
                      onChange={(event) => setSelectedAssigneeId(event.target.value)}
                      disabled={isAssigning}
                    >
                      {assignees.map((user) => (
                        <MenuItem key={user.id} value={user.id}>
                          {deriveActorDisplayName(user)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Button
                    variant="contained"
                    onClick={() => void handleAssign()}
                    disabled={!selectedAssigneeId || isAssigning}
                  >
                    {isAssigning ? "Assigning..." : "Assign Recording"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent sx={{ display: "grid", gap: 1.5 }}>
              <Typography variant="h6" fontWeight={700}>
                System Info
              </Typography>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Recording ID
                </Typography>
                <Typography variant="body2">{recording.id}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Mime Type
                </Typography>
                <Typography variant="body2">{recording.mimeType}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Storage Key
                </Typography>
                <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                  {recording.objectKey}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Stack>
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
    </Box>
  );
}
