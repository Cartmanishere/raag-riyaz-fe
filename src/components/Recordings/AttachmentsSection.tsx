"use client";

import * as React from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { adminRecordingsApi } from "@/services/api";
import { ApiError, RecordingAttachment, RecordingAttachmentType } from "@/types";

interface AttachmentsSectionProps {
  recordingId: string;
  open: boolean;
}

function inferAttachmentType(file: File): RecordingAttachmentType | null {
  if (file.type.startsWith("image/")) {
    return "image";
  }

  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    return "pdf";
  }

  return null;
}

function formatFileSize(fileSizeBytes: number) {
  if (fileSizeBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(fileSizeBytes / 1024))} KB`;
  }

  return `${(fileSizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getAttachmentLabel(attachment: RecordingAttachment) {
  return attachment.type === "pdf" ? "PDF attachment" : "Image attachment";
}

export default function AttachmentsSection({
  recordingId,
  open,
}: AttachmentsSectionProps) {
  const [attachments, setAttachments] = React.useState<RecordingAttachment[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const loadAttachments = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const result = await adminRecordingsApi.listAttachments(recordingId);
      setAttachments(result);
    } catch (err) {
      setLoadError((err as ApiError)?.message ?? "Failed to load attachments.");
    } finally {
      setIsLoading(false);
    }
  }, [recordingId]);

  React.useEffect(() => {
    if (!open || !recordingId) {
      return;
    }

    void loadAttachments();
  }, [loadAttachments, open, recordingId]);

  const handleUploadClick = () => {
    setUploadError(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    event.target.value = "";

    const attachmentType = inferAttachmentType(file);
    if (!attachmentType) {
      setUploadError("Only image and PDF attachments are supported.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const uploaded = await adminRecordingsApi.uploadAttachment(recordingId, {
        file,
        type: attachmentType,
        mimeType: file.type || undefined,
      });

      setAttachments((current) => [...current, uploaded]);
    } catch (err) {
      const apiError = err as ApiError;
      setUploadError(
        apiError?.statusCode === 409
          ? "Recording already has the maximum number of attachments."
          : (apiError?.message ?? "Failed to upload attachment."),
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (attachmentId: string) => {
    setDeletingId(attachmentId);
    setDeleteError(null);

    try {
      await adminRecordingsApi.deleteAttachment(recordingId, attachmentId);
      setAttachments((current) =>
        current.filter((attachment) => attachment.id !== attachmentId),
      );
    } catch (err) {
      setDeleteError((err as ApiError)?.message ?? "Failed to delete attachment.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Box sx={{ display: "grid", gap: 1.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="subtitle2" fontWeight={700}>
          Attachments
        </Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={isUploading ? <CircularProgress size={14} /> : <AddPhotoAlternateIcon />}
          onClick={handleUploadClick}
          disabled={isUploading}
        >
          {isUploading ? "Uploading..." : "Upload"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          style={{ display: "none" }}
          onChange={(event) => void handleFileChange(event)}
        />
      </Box>

      {uploadError && (
        <Alert severity="error" onClose={() => setUploadError(null)}>
          {uploadError}
        </Alert>
      )}
      {deleteError && (
        <Alert severity="error" onClose={() => setDeleteError(null)}>
          {deleteError}
        </Alert>
      )}

      {isLoading ? (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <CircularProgress size={20} />
          <Typography variant="body2" color="text.secondary">
            Loading attachments...
          </Typography>
        </Stack>
      ) : loadError ? (
        <Stack spacing={1}>
          <Alert severity="error">{loadError}</Alert>
          <Box>
            <Button size="small" variant="outlined" onClick={() => void loadAttachments()}>
              Retry
            </Button>
          </Box>
        </Stack>
      ) : attachments.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No attachments uploaded yet.
        </Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: 1.25,
          }}
        >
          {attachments.map((attachment) => {
            const isDeleting = deletingId === attachment.id;

            return (
              <Box
                key={attachment.id}
                sx={{
                  position: "relative",
                  display: "grid",
                  minHeight: 140,
                  borderRadius: 1,
                  overflow: "hidden",
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: attachment.type === "image" ? "grey.100" : "background.paper",
                  "&:hover .attachment-action": { opacity: 1 },
                }}
              >
                {attachment.type === "image" ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={attachment.url}
                      alt={getAttachmentLabel(attachment)}
                      style={{
                        width: "100%",
                        height: "100%",
                        minHeight: 140,
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                    <Box
                      sx={{
                        position: "absolute",
                        inset: "auto 0 0 0",
                        px: 1,
                        py: 0.75,
                        bgcolor: "rgba(0,0,0,0.55)",
                        color: "#fff",
                      }}
                    >
                      <Typography variant="caption" sx={{ display: "block" }}>
                        {attachment.mimeType}
                      </Typography>
                      <Typography variant="caption" sx={{ display: "block", opacity: 0.85 }}>
                        {formatFileSize(attachment.fileSizeBytes)}
                      </Typography>
                    </Box>
                  </>
                ) : (
                  <Stack
                    spacing={1}
                    sx={{
                      height: "100%",
                      justifyContent: "space-between",
                      p: 1.5,
                    }}
                  >
                    <Stack spacing={1}>
                      <PictureAsPdfIcon sx={{ color: "error.main", fontSize: 32 }} />
                      <Typography variant="body2" fontWeight={600}>
                        PDF attachment
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {attachment.mimeType}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {formatFileSize(attachment.fileSizeBytes)}
                    </Typography>
                  </Stack>
                )}

                <Box
                  sx={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    display: "flex",
                    gap: 0.5,
                  }}
                >
                  <Tooltip title="Open attachment">
                    <IconButton
                      className="attachment-action"
                      size="small"
                      component="a"
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      sx={{
                        opacity: 0,
                        transition: "opacity 0.15s",
                        bgcolor: "rgba(0,0,0,0.55)",
                        color: "#fff",
                        "&:hover": { bgcolor: "rgba(0,0,0,0.72)" },
                      }}
                    >
                      <OpenInNewIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete attachment">
                    <span>
                      <IconButton
                        className="attachment-action"
                        size="small"
                        onClick={() => void handleDelete(attachment.id)}
                        disabled={isDeleting}
                        sx={{
                          opacity: 0,
                          transition: "opacity 0.15s",
                          bgcolor: "rgba(0,0,0,0.55)",
                          color: "#fff",
                          "&:hover": { bgcolor: "error.main" },
                          "&.Mui-disabled": { opacity: 0.5 },
                        }}
                      >
                        {isDeleting ? (
                          <CircularProgress size={14} sx={{ color: "#fff" }} />
                        ) : (
                          <DeleteOutlineIcon fontSize="small" />
                        )}
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
