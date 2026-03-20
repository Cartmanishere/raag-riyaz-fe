"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  MobileStepper,
  Stack,
  Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CloseIcon from "@mui/icons-material/Close";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
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

function formatDateTime(value: string) {
  const timestamp = new Date(value);

  if (Number.isNaN(timestamp.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp);
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

interface StudentRecordingPracticeScreenProps {
  recordingId: string;
}

export default function StudentRecordingPracticeScreen({
  recordingId,
}: StudentRecordingPracticeScreenProps) {
  const router = useRouter();
  const [recording, setRecording] = React.useState<AssignedRecording | null>(null);
  const [attachments, setAttachments] = React.useState<RecordingAttachment[]>([]);
  const [attachmentIndex, setAttachmentIndex] = React.useState(0);
  const [imagePreview, setImagePreview] = React.useState<RecordingAttachment | null>(null);

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

  const activeAttachment = attachments[attachmentIndex] ?? null;

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
        <Button
          variant="text"
          startIcon={<ArrowBackRoundedIcon />}
          onClick={() => router.push("/student-dashboard")}
          sx={{ alignSelf: "flex-start" }}
        >
          Back to assignments
        </Button>
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
        <Button
          variant="text"
          startIcon={<ArrowBackRoundedIcon />}
          onClick={() => router.push("/student-dashboard")}
          sx={{ alignSelf: "flex-start" }}
        >
          Back to assignments
        </Button>

        <Card
          sx={{
            borderRadius: 4,
            color: "#10243f",
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(240,246,255,0.94) 100%)",
            border: "1px solid rgba(55,125,205,0.12)",
            boxShadow: "0 24px 60px rgba(15, 23, 42, 0.06)",
          }}
        >
          <CardContent sx={{ p: { xs: 2.5, sm: 3.25 } }}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h4" gutterBottom>
                  {recording.title}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip label={recording.raag} color="primary" />
                  {recording.taal ? <Chip label={`Taal: ${recording.taal}`} variant="outlined" /> : null}
                  <Chip label={`Assigned ${formatAssignedAt(recording.assignedAt)}`} variant="outlined" />
                </Stack>
              </Box>

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
                    controls
                    autoPlay
                    preload="metadata"
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

        <Card
          variant="outlined"
          sx={{
            borderRadius: 4,
            borderColor: "rgba(55,125,205,0.14)",
            backgroundColor: "rgba(255,255,255,0.95)",
          }}
        >
          <CardContent sx={{ p: { xs: 2.25, sm: 2.75 } }}>
            <Stack spacing={1.25}>
              <Stack direction="row" spacing={1} alignItems="center">
                <StickyNote2OutlinedIcon color="primary" fontSize="small" />
                <Typography variant="subtitle1" fontWeight={700}>
                  Recording note
                </Typography>
              </Stack>
              <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                {recording.notes?.trim() || "No written notes for this recording."}
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        <Card
          variant="outlined"
          sx={{
            borderRadius: 4,
            overflow: "hidden",
            borderColor: "rgba(15, 23, 42, 0.08)",
            backgroundColor: "rgba(255,255,255,0.95)",
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
                      backgroundColor: "grey.100",
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    {isPdfAttachment(activeAttachment) ? (
                      <Stack sx={{ height: "100%" }}>
                        <Stack
                          direction="row"
                          spacing={1.25}
                          alignItems="center"
                          sx={{ px: 2, py: 1.5, bgcolor: "rgba(255,255,255,0.9)" }}
                        >
                          <PictureAsPdfOutlinedIcon sx={{ color: "error.main" }} />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="subtitle2" fontWeight={700}>
                              PDF attachment
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {activeAttachment.mimeType} • {formatFileSize(activeAttachment.fileSizeBytes)}
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
                            data={activeAttachment.url}
                            type={activeAttachment.mimeType}
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
                      <Box sx={{ position: "relative", cursor: "pointer" }} onClick={() => setImagePreview(activeAttachment)}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={activeAttachment.url}
                          alt="Recording attachment"
                          style={{
                            display: "block",
                            width: "100%",
                            minHeight: 240,
                            maxHeight: 420,
                            objectFit: "cover",
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
                    {!isPdfAttachment(activeAttachment) ? (
                      <Button variant="outlined" onClick={() => setImagePreview(activeAttachment)}>
                        View image
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
        onClose={() => setImagePreview(null)}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent
          sx={{
            p: 0,
            bgcolor: "#0f172a",
            position: "relative",
          }}
        >
          <IconButton
            onClick={() => setImagePreview(null)}
            sx={{
              position: "absolute",
              top: 12,
              right: 12,
              zIndex: 1,
              color: "#fff",
              bgcolor: "rgba(15, 23, 42, 0.54)",
            }}
          >
            <CloseIcon />
          </IconButton>
          {imagePreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imagePreview.url}
              alt="Attachment preview"
              style={{
                width: "100%",
                display: "block",
                maxHeight: "90vh",
                objectFit: "contain",
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
