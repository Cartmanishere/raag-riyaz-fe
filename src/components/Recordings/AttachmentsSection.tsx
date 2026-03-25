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
  open?: boolean;
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
  open = true,
}: AttachmentsSectionProps) {
  const [attachments, setAttachments] = React.useState<RecordingAttachment[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const imageRetryCountRef = React.useRef(0);

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

  const handleImageError = () => {
    if (imageRetryCountRef.current >= 1) {
      return;
    }

    imageRetryCountRef.current += 1;
    void loadAttachments();
  };

  const handleUploadClick = () => {
    setUploadError(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    if (selectedFiles.length === 0) {
      return;
    }

    event.target.value = "";

    setIsUploading(true);
    setUploadError(null);

    const validFiles = selectedFiles
      .map((file) => ({
        file,
        type: inferAttachmentType(file),
      }))
      .filter(
        (item): item is { file: File; type: RecordingAttachmentType } => item.type !== null
      );
    const invalidFiles = selectedFiles.filter((file) => inferAttachmentType(file) === null);
    const uploadedAttachments: RecordingAttachment[] = [];
    const failedFileNames: string[] = [];
    let limitReached = false;

    try {
      for (const { file, type } of validFiles) {
        try {
          const uploaded = await adminRecordingsApi.uploadAttachment(recordingId, {
            file,
            type,
            mimeType: file.type || undefined,
          });

          uploadedAttachments.push(uploaded);
        } catch (err) {
          const apiError = err as ApiError;

          if (apiError?.statusCode === 409) {
            limitReached = true;
            break;
          }

          failedFileNames.push(file.name);
        }
      }

      if (uploadedAttachments.length > 0) {
        setAttachments((current) => [...current, ...uploadedAttachments]);
      }

      const issues: string[] = [];

      if (invalidFiles.length > 0) {
        issues.push(
          `Unsupported files skipped: ${invalidFiles.map((file) => file.name).join(", ")}.`
        );
      }

      if (failedFileNames.length > 0) {
        issues.push(`Failed to upload: ${failedFileNames.join(", ")}.`);
      }

      if (limitReached) {
        issues.push("Recording already has the maximum number of attachments.");
      }

      if (issues.length > 0) {
        setUploadError(issues.join(" "));
      }
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
          multiple
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
                      onError={handleImageError}
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
