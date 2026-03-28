"use client";

import * as React from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import { adminRecordingsApi } from "@/services/api";
import { ApiError, PlaybackInfo, Recording } from "@/types";
import AttachmentsSection from "./AttachmentsSection";
import BulkAssignRecordingsDialog, {
  BulkAssignTarget,
} from "./BulkAssignRecordingsDialog";

function toErrorMessage(error: ApiError | null, fallback: string) {
  return error?.message ?? fallback;
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

interface RecordingDetailDrawerProps {
  open: boolean;
  recording?: Recording;
  onClose: () => void;
  onEdit: (recording: Recording) => void;
  onDelete: (recording: Recording) => void;
}

export default function RecordingDetailDrawer({
  open,
  recording,
  onClose,
  onEdit,
  onDelete,
}: RecordingDetailDrawerProps) {
  const [playbackInfo, setPlaybackInfo] = React.useState<PlaybackInfo | null>(null);
  const [isPlaybackLoading, setIsPlaybackLoading] = React.useState(false);
  const [playbackError, setPlaybackError] = React.useState<string | null>(null);
  const playbackRetryCountRef = React.useRef(0);
  const playbackRequestIdRef = React.useRef(0);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = React.useState(false);
  const [isAssigning, setIsAssigning] = React.useState(false);
  const [assignmentFeedback, setAssignmentFeedback] = React.useState<{
    severity: "success" | "warning" | "error";
    message: string;
  } | null>(null);

  const loadPlayback = React.useCallback(
    async (options?: { resetRetryCount?: boolean }) => {
      if (!recording) {
        return;
      }

      const requestId = ++playbackRequestIdRef.current;
      setIsPlaybackLoading(true);
      setPlaybackError(null);

      try {
        const nextPlaybackInfo = await adminRecordingsApi.getPlayback(recording.id);

        if (requestId !== playbackRequestIdRef.current) {
          return;
        }

        setPlaybackInfo(nextPlaybackInfo);

        if (options?.resetRetryCount ?? true) {
          playbackRetryCountRef.current = 0;
        }
      } catch (err) {
        if (requestId !== playbackRequestIdRef.current) {
          return;
        }

        const apiError = err as ApiError;
        setPlaybackInfo(null);
        setPlaybackError(
          toErrorMessage(apiError, "Unable to load playback for this recording.")
        );
      } finally {
        if (requestId === playbackRequestIdRef.current) {
          setIsPlaybackLoading(false);
        }
      }
    },
    [recording]
  );

  React.useEffect(() => {
    if (!open || !recording) {
      return;
    }

    setAssignmentFeedback(null);
    void loadPlayback({ resetRetryCount: true });
  }, [loadPlayback, open, recording]);

  const handlePlaybackRetry = () => {
    void loadPlayback({ resetRetryCount: true });
  };

  const handleAudioError = () => {
    if (!recording) {
      return;
    }

    if (playbackRetryCountRef.current >= 1) {
      setPlaybackError(
        "Playback failed after refreshing the signed URL. Please try again."
      );
      return;
    }

    playbackRetryCountRef.current += 1;
    void loadPlayback({ resetRetryCount: false });
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

  if (!recording) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      scroll="paper"
      PaperProps={{
        sx: {
          width: "100%",
          maxHeight: "min(88vh, 920px)",
          borderRadius: 3,
        },
      }}
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
          Recording Detail
        </Typography>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Button
            size="small"
            color="error"
            startIcon={<DeleteOutlineIcon />}
            onClick={() => onDelete(recording)}
            variant="outlined"
          >
            Delete
          </Button>
          <Button
            size="small"
            startIcon={<EditIcon />}
            onClick={() => onEdit(recording)}
            variant="outlined"
          >
            Edit
          </Button>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      <DialogContent
        dividers
        sx={{ px: 3, py: 3, display: "flex", flexDirection: "column", gap: 3 }}
      >
        {/* Details */}
        <Box>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            {recording.title}
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1.5 }}>
            {recording.raag?.trim() ? (
              <Chip
                label={recording.raag.trim()}
                size="small"
                sx={{
                  backgroundColor: "primary.main",
                  color: "primary.contrastText",
                  fontWeight: 600,
                }}
              />
            ) : null}
            {recording.taal?.trim() && (
              <Chip label={`Taal: ${recording.taal.trim()}`} size="small" variant="outlined" />
            )}
          </Box>
          {recording.notes && (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
              "{recording.notes}"
            </Typography>
          )}
        </Box>

        <Divider />

        <Box sx={{ display: "grid", gap: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={700}>
            Playback
          </Typography>

          {isPlaybackLoading ? (
            <Stack direction="row" spacing={1.5} alignItems="center">
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                Loading playback URL...
              </Typography>
            </Stack>
          ) : playbackInfo ? (
            <Stack spacing={1.5}>
              <audio
                key={playbackInfo.url}
                controls
                preload="none"
                src={playbackInfo.url}
                onError={handleAudioError}
                style={{ width: "100%" }}
              >
                Your browser does not support audio playback.
              </audio>
              <Typography variant="caption" color="text.secondary">
                Link expires {formatDateTime(playbackInfo.expiresAt)}
              </Typography>
            </Stack>
          ) : (
            <Stack spacing={1.5}>
              <Alert severity="error">
                {playbackError ?? "Playback is unavailable for this recording."}
              </Alert>
              <Box>
                <Button variant="outlined" size="small" onClick={handlePlaybackRetry}>
                  Retry Playback
                </Button>
              </Box>
            </Stack>
          )}
        </Box>

        <Divider />

        <Box sx={{ display: "grid", gap: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={700}>
            Assign Recording
          </Typography>

          {assignmentFeedback ? (
            <Alert severity={assignmentFeedback.severity}>
              {assignmentFeedback.message}
            </Alert>
          ) : null}

          <Typography variant="body2" color="text.secondary">
            Open the same batch-or-student assignment flow used on the recordings list.
          </Typography>

          <Box>
            <Button
              variant="contained"
              size="small"
              onClick={() => setIsAssignDialogOpen(true)}
              disabled={isAssigning}
            >
              {isAssigning ? "Assigning..." : "Assign Recording"}
            </Button>
          </Box>
        </Box>

        <Divider />

        <AttachmentsSection recordingId={recording.id} open={open} />

        <Divider />

        <Box sx={{ display: "grid", gap: 1.5 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Recording ID
            </Typography>
            <Typography variant="body2">{recording.id}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              MIME type
            </Typography>
            <Typography variant="body2">{recording.mimeType}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Storage object key
            </Typography>
            <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
              {recording.objectKey}
            </Typography>
          </Box>
        </Box>
      </DialogContent>

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
    </Dialog>
  );
}
