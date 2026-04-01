"use client";

import * as React from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  MobileStepper,
  Stack,
  Typography,
} from "@mui/material";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CloseIcon from "@mui/icons-material/Close";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import RotateRightIcon from "@mui/icons-material/RotateRight";
import StickyNote2OutlinedIcon from "@mui/icons-material/StickyNote2Outlined";
import SubscriptionsOutlinedIcon from "@mui/icons-material/SubscriptionsOutlined";
import { ApiError, AssignedRecording, PlaybackInfo, RecordingAttachment } from "@/types";
import { userRecordingsApi } from "@/services/api";

function formatAssignedAt(value: string) {
  const assignedAt = new Date(value);

  if (Number.isNaN(assignedAt.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(assignedAt);
}

function toErrorMessage(error: ApiError | null, fallback: string) {
  return error?.message ?? fallback;
}

function formatFileSize(fileSizeBytes: number) {
  if (fileSizeBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(fileSizeBytes / 1024))} KB`;
  }

  return `${(fileSizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isPdfAttachment(attachment: RecordingAttachment) {
  return attachment.type === "pdf";
}

function hasAttachmentPreview(attachment: RecordingAttachment) {
  return Boolean(attachment.previewUrl?.trim());
}

function getAttachmentDisplayUrl(attachment: RecordingAttachment) {
  const previewUrl = attachment.previewUrl?.trim();
  return previewUrl ? previewUrl : attachment.url;
}

function getAttachmentDisplayMimeType(attachment: RecordingAttachment) {
  const previewMimeType = attachment.previewMimeType?.trim();
  return previewMimeType ? previewMimeType : attachment.mimeType;
}

interface StudentRecordingPracticeScreenProps {
  recordingId: string;
}

export default function StudentRecordingPracticeScreen({
  recordingId,
}: StudentRecordingPracticeScreenProps) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [recording, setRecording] = React.useState<AssignedRecording | null>(null);
  const [attachments, setAttachments] = React.useState<RecordingAttachment[]>([]);
  const [attachmentIndex, setAttachmentIndex] = React.useState(0);
  const [imagePreview, setImagePreview] = React.useState<RecordingAttachment | null>(null);
  const [imagePreviewRotation, setImagePreviewRotation] = React.useState(0);

  const [isPageLoading, setIsPageLoading] = React.useState(true);
  const [pageError, setPageError] = React.useState<ApiError | null>(null);

  const [playbackInfo, setPlaybackInfo] = React.useState<PlaybackInfo | null>(null);
  const [isPlaybackLoading, setIsPlaybackLoading] = React.useState(false);
  const [playbackError, setPlaybackError] = React.useState<string | null>(null);
  const playbackRetryCountRef = React.useRef(0);
  const playbackRequestIdRef = React.useRef(0);

  const [isAttachmentsLoading, setIsAttachmentsLoading] = React.useState(false);
  const [attachmentsError, setAttachmentsError] = React.useState<string | null>(null);
  const attachmentsRequestIdRef = React.useRef(0);
  const attachmentsRetryCountRef = React.useRef(0);

  const activeAttachment = attachments[attachmentIndex] ?? null;
  const activeAttachmentDisplayUrl = activeAttachment
    ? getAttachmentDisplayUrl(activeAttachment)
    : null;
  const activeAttachmentDisplayMimeType = activeAttachment
    ? getAttachmentDisplayMimeType(activeAttachment)
    : null;
  const activeAttachmentHasPreview = activeAttachment
    ? hasAttachmentPreview(activeAttachment)
    : false;
  const recordingNotes = recording?.notes?.trim() ?? "";

  const loadRecording = React.useCallback(async () => {
    setIsPageLoading(true);
    setPageError(null);

    try {
      const nextRecording = await userRecordingsApi.getById(recordingId);
      setRecording(nextRecording);
    } catch (err) {
      const apiError = err as ApiError;
      setPageError({
        code: apiError?.code,
        message: apiError?.message ?? "Unable to load this recording.",
        statusCode: apiError?.statusCode ?? 500,
      });
      setRecording(null);
    } finally {
      setIsPageLoading(false);
    }
  }, [recordingId]);

  const loadPlayback = React.useCallback(
    async (options?: { resetRetryCount?: boolean }) => {
      const requestId = ++playbackRequestIdRef.current;
      setIsPlaybackLoading(true);
      setPlaybackError(null);

      try {
        const nextPlaybackInfo = await userRecordingsApi.getPlayback(recordingId);

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
          toErrorMessage(apiError, "Playback is unavailable for this recording."),
        );
      } finally {
        if (requestId === playbackRequestIdRef.current) {
          setIsPlaybackLoading(false);
        }
      }
    },
    [recordingId],
  );

  const loadAttachments = React.useCallback(async () => {
    const requestId = ++attachmentsRequestIdRef.current;
    setIsAttachmentsLoading(true);
    setAttachmentsError(null);

    try {
      const nextAttachments = await userRecordingsApi.listAttachments(recordingId);

      if (requestId !== attachmentsRequestIdRef.current) {
        return;
      }

      setAttachments(nextAttachments);
      setAttachmentIndex(0);
    } catch (err) {
      if (requestId !== attachmentsRequestIdRef.current) {
        return;
      }

      const apiError = err as ApiError;
      setAttachments([]);
      setAttachmentIndex(0);
      setAttachmentsError(
        toErrorMessage(apiError, "Attachments are unavailable right now."),
      );
    } finally {
      if (requestId === attachmentsRequestIdRef.current) {
        setIsAttachmentsLoading(false);
      }
    }
  }, [recordingId]);

  React.useEffect(() => {
    void loadRecording();
    void loadPlayback({ resetRetryCount: true });
    void loadAttachments();
  }, [loadAttachments, loadPlayback, loadRecording]);

  const handleAudioError = () => {
    if (playbackRetryCountRef.current >= 1) {
      setPlaybackError(
        "Playback failed after refreshing the signed URL. Please try again.",
      );
      return;
    }

    playbackRetryCountRef.current += 1;
    void loadPlayback({ resetRetryCount: false });
  };

  const handleImageError = () => {
    if (attachmentsRetryCountRef.current >= 1) {
      return;
    }

    attachmentsRetryCountRef.current += 1;
    void loadAttachments();
  };

  const handlePreviousAttachment = () => {
    setAttachmentIndex((current) =>
      current === 0 ? attachments.length - 1 : current - 1,
    );
  };

  const handleNextAttachment = () => {
    setAttachmentIndex((current) =>
      current === attachments.length - 1 ? 0 : current + 1,
    );
  };

  const handleOpenImagePreview = (attachment: RecordingAttachment) => {
    setImagePreview(attachment);
    setImagePreviewRotation(0);
  };

  const handleCloseImagePreview = () => {
    setImagePreview(null);
    setImagePreviewRotation(0);
  };

  if (isPageLoading) {
    return (
      <Stack spacing={1.5} alignItems="center" sx={{ py: 10 }}>
        <CircularProgress size={32} />
        <Typography variant="body2" color="text.secondary">
          Loading practice screen...
        </Typography>
      </Stack>
    );
  }

  if (pageError || !recording) {
    return (
      <Stack spacing={1.5}>
        <Alert severity="error">{pageError?.message ?? "Unable to load this recording."}</Alert>
        <Box>
          <Button variant="outlined" onClick={() => void loadRecording()}>
            Retry
          </Button>
        </Box>
      </Stack>
    );
  }

  return (
    <>
      <Stack spacing={3}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: recordingNotes
              ? { xs: "1fr", lg: "minmax(0, 1.15fr) minmax(0, 0.85fr)" }
              : "1fr",
            gap: 3,
          }}
        >
          <Card
            variant="outlined"
            sx={{
              borderRadius: 4,
              borderColor: "rgba(42,30,24,0.10)",
              backgroundColor: "rgba(238,230,216,0.95)",
            }}
          >
            <CardContent sx={{ p: { xs: 2.25, sm: 2.75 } }}>
              <Stack spacing={1.5}>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={2}
                  justifyContent="space-between"
                  alignItems={{ xs: "stretch", md: "flex-start" }}
                >
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="h5" fontWeight={700} gutterBottom>
                      {recording.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Assigned {formatAssignedAt(recording.assignedAt)}
                    </Typography>
                  </Box>
                </Stack>

                {isPlaybackLoading ? (
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <CircularProgress size={20} />
                    <Typography variant="body2" color="text.secondary">
                      Loading playback...
                    </Typography>
                  </Stack>
                ) : playbackInfo ? (
                  <Stack spacing={1}>
                    <audio
                      key={playbackInfo.url}
                      ref={audioRef}
                      controls
                      autoPlay
                      preload="metadata"
                      src={playbackInfo.url}
                      onError={handleAudioError}
                      style={{ width: "100%" }}
                    >
                      Your browser does not support audio playback.
                    </audio>
                  </Stack>
                ) : (
                  <Stack spacing={1.25}>
                    <Alert severity="error">
                      {playbackError ?? "Playback is unavailable for this recording."}
                    </Alert>
                    <Box>
                      <Button variant="outlined" onClick={() => void loadPlayback({ resetRetryCount: true })}>
                        Retry playback
                      </Button>
                    </Box>
                  </Stack>
                )}
              </Stack>
            </CardContent>
          </Card>

          {recordingNotes ? (
            <Card
              variant="outlined"
              sx={{
                borderRadius: 4,
                borderColor: "rgba(42,30,24,0.10)",
                backgroundColor: "rgba(238,230,216,0.95)",
              }}
            >
              <CardContent sx={{ p: { xs: 2.25, sm: 2.75 } }}>
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <StickyNote2OutlinedIcon color="primary" fontSize="small" />
                    <Typography variant="subtitle1" fontWeight={700}>
                      Recording note
                    </Typography>
                  </Stack>
                  <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                    {recordingNotes}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          ) : null}
        </Box>

        <Card
          variant="outlined"
          sx={{
            borderRadius: 4,
            overflow: "hidden",
            borderColor: "rgba(42,30,24,0.10)",
            backgroundColor: "rgba(238,230,216,0.95)",
          }}
        >
          <CardContent sx={{ p: { xs: 2.25, sm: 2.75 } }}>
            <Stack spacing={2}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "center" }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <SubscriptionsOutlinedIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle1" fontWeight={700}>
                    Practice attachments
                  </Typography>
                </Stack>

                {attachments.length > 1 ? (
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<ChevronLeftRoundedIcon />}
                      onClick={handlePreviousAttachment}
                    >
                      Prev
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      endIcon={<ChevronRightRoundedIcon />}
                      onClick={handleNextAttachment}
                    >
                      Next
                    </Button>
                  </Stack>
                ) : null}
              </Stack>

              {isAttachmentsLoading ? (
                <Stack spacing={1.5} alignItems="center" sx={{ py: 6 }}>
                  <CircularProgress size={28} />
                  <Typography variant="body2" color="text.secondary">
                    Loading attachments...
                  </Typography>
                </Stack>
              ) : attachmentsError ? (
                <Stack spacing={1.5}>
                  <Alert severity="error">{attachmentsError}</Alert>
                  <Box>
                    <Button variant="outlined" onClick={() => void loadAttachments()}>
                      Retry
                    </Button>
                  </Box>
                </Stack>
              ) : !activeAttachment ? (
                <Stack spacing={1} alignItems="center" justifyContent="center" sx={{ py: 6, textAlign: "center" }}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    No attachments for this recording
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Any image or PDF references from your teacher will appear here.
                  </Typography>
                </Stack>
              ) : (
                <Stack spacing={1.5}>
                  <Box
                    sx={{
                      minHeight: { xs: 240, sm: 320 },
                      borderRadius: 3,
                      overflow: "hidden",
                      backgroundColor: "#e0d0b8",
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    {isPdfAttachment(activeAttachment) && !activeAttachmentHasPreview ? (
                      <Stack sx={{ height: "100%" }}>
                        <Stack
                          direction="row"
                          spacing={1.25}
                          alignItems="center"
                          sx={{ px: 2, py: 1.5, bgcolor: "rgba(238,230,216,0.9)" }}
                        >
                          <PictureAsPdfOutlinedIcon sx={{ color: "error.main" }} />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="subtitle2" fontWeight={700}>
                              PDF attachment
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {activeAttachmentDisplayMimeType} •{" "}
                              {formatFileSize(activeAttachment.fileSizeBytes)}
                            </Typography>
                          </Box>
                          <Button
                            size="small"
                            variant="outlined"
                            endIcon={<OpenInNewIcon />}
                            href={activeAttachment.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open PDF
                          </Button>
                        </Stack>
                        <Box sx={{ flex: 1 }}>
                          <object
                            data={activeAttachmentDisplayUrl ?? activeAttachment.url}
                            type={activeAttachmentDisplayMimeType ?? activeAttachment.mimeType}
                            width="100%"
                            height="320"
                          >
                            <Box sx={{ p: 2 }}>
                              <Typography variant="body2" color="text.secondary">
                                Inline preview is unavailable in this browser.
                              </Typography>
                            </Box>
                          </object>
                        </Box>
                      </Stack>
                    ) : (
                      <Box
                        sx={{
                          position: "relative",
                          cursor: "pointer",
                          minHeight: { xs: 240, sm: 320 },
                          maxHeight: 420,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          p: 1.5,
                          backgroundColor: "rgba(224,208,184,0.72)",
                        }}
                        onClick={() => handleOpenImagePreview(activeAttachment)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={activeAttachmentDisplayUrl ?? activeAttachment.url}
                          alt="Recording attachment"
                          onError={handleImageError}
                          style={{
                            display: "block",
                            maxWidth: "100%",
                            width: "auto",
                            height: "auto",
                            maxHeight: 390,
                            objectFit: "contain",
                          }}
                        />
                      </Box>
                    )}
                  </Box>

                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.25}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", sm: "center" }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {attachments.length > 1
                        ? `Attachment ${attachmentIndex + 1} of ${attachments.length}`
                        : "1 attachment"}
                    </Typography>
                    {activeAttachmentHasPreview ? (
                      <Button variant="outlined" onClick={() => handleOpenImagePreview(activeAttachment)}>
                        View image
                      </Button>
                    ) : isPdfAttachment(activeAttachment) ? (
                      <Button
                        variant="outlined"
                        endIcon={<OpenInNewIcon />}
                        href={activeAttachment.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open PDF
                      </Button>
                    ) : null}
                  </Stack>

                  {attachments.length > 1 ? (
                    <MobileStepper
                      variant="dots"
                      steps={attachments.length}
                      position="static"
                      activeStep={attachmentIndex}
                      nextButton={<Box />}
                      backButton={<Box />}
                      sx={{
                        px: 0,
                        bgcolor: "transparent",
                        justifyContent: "center",
                      }}
                    />
                  ) : null}
                </Stack>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      <Dialog
        open={Boolean(imagePreview)}
        onClose={handleCloseImagePreview}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent
          sx={{
            p: 0,
            bgcolor: "#1a0f0c",
            position: "relative",
            overflow: "auto",
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            sx={{
              position: "absolute",
              top: 12,
              left: 12,
              zIndex: 1,
            }}
          >
            <IconButton
              onClick={() =>
                setImagePreviewRotation((current) => (current + 90) % 360)
              }
              sx={{
                color: "#fff",
                bgcolor: "rgba(42,30,24,0.65)",
              }}
              aria-label="Rotate image right"
            >
              <RotateRightIcon />
            </IconButton>
          </Stack>
          <IconButton
            onClick={handleCloseImagePreview}
            sx={{
              position: "absolute",
              top: 12,
              right: 12,
              zIndex: 1,
              color: "#fff",
              bgcolor: "rgba(42,30,24,0.65)",
            }}
          >
            <CloseIcon />
          </IconButton>
          {imagePreview ? (
            <Box
              sx={{
                minHeight: "90vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: { xs: 2, sm: 3, md: 4 },
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getAttachmentDisplayUrl(imagePreview)}
                alt="Attachment preview"
                onError={handleImageError}
                style={{
                  display: "block",
                  maxWidth: imagePreviewRotation % 180 === 0 ? "100%" : "75vh",
                  maxHeight: imagePreviewRotation % 180 === 0 ? "75vh" : "100%",
                  width: "auto",
                  height: "auto",
                  objectFit: "contain",
                  transform: `rotate(${imagePreviewRotation}deg)`,
                  transformOrigin: "center center",
                }}
              />
            </Box>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
