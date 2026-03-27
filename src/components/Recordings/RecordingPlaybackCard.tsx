"use client";

import * as React from "react";
import { Alert, Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { adminRecordingsApi } from "@/services/api";
import { ApiError, PlaybackInfo } from "@/types";

interface RecordingPlaybackCardProps {
  recordingId: string;
}

function toErrorMessage(error: ApiError | null, fallback: string) {
  return error?.message ?? fallback;
}

export default function RecordingPlaybackCard({
  recordingId,
}: RecordingPlaybackCardProps) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const playbackRetryCountRef = React.useRef(0);
  const playbackRequestIdRef = React.useRef(0);
  const [playbackInfo, setPlaybackInfo] = React.useState<PlaybackInfo | null>(null);
  const [isPlaybackLoading, setIsPlaybackLoading] = React.useState(false);
  const [playbackError, setPlaybackError] = React.useState<string | null>(null);

  const loadPlayback = React.useCallback(
    async (options?: { resetRetryCount?: boolean }) => {
      const requestId = ++playbackRequestIdRef.current;
      setIsPlaybackLoading(true);
      setPlaybackError(null);

      try {
        const nextPlaybackInfo = await adminRecordingsApi.getPlayback(recordingId);

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

  React.useEffect(() => {
    playbackRetryCountRef.current = 0;
    void loadPlayback({ resetRetryCount: true });
  }, [loadPlayback]);

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

  return (
    <Stack spacing={1.25} sx={{ width: "100%", maxWidth: 420 }}>
      <Box>
        <Typography variant="body2" color="text.secondary">
          Playback
        </Typography>
      </Box>

      {isPlaybackLoading ? (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <CircularProgress size={20} />
          <Typography variant="body2" color="text.secondary">
            Loading playback...
          </Typography>
        </Stack>
      ) : playbackInfo ? (
        <audio
          key={playbackInfo.url}
          ref={audioRef}
          controls
          preload="metadata"
          src={playbackInfo.url}
          onError={handleAudioError}
          style={{ width: "100%" }}
        >
          Your browser does not support audio playback.
        </audio>
      ) : (
        <Stack spacing={1.25}>
          <Alert severity="error">
            {playbackError ?? "Playback is unavailable for this recording."}
          </Alert>
          <Box>
            <Button
              variant="outlined"
              onClick={() => void loadPlayback({ resetRetryCount: true })}
            >
              Retry playback
            </Button>
          </Box>
        </Stack>
      )}
    </Stack>
  );
}
