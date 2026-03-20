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
  Stack,
  Typography,
} from "@mui/material";
import AlbumIcon from "@mui/icons-material/Album";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import QueueMusicRoundedIcon from "@mui/icons-material/QueueMusicRounded";
import { deriveActorDisplayName } from "@/services/auth-session";
import { userRecordingsApi } from "@/services/api";
import { useAuth } from "@/components/Auth/AuthProvider";
import { ApiError, AssignedRecording } from "@/types";

function formatAssignedAt(value: string) {
  const assignedAt = new Date(value);

  if (Number.isNaN(assignedAt.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(assignedAt);
}

export default function StudentPracticeScreen() {
  const router = useRouter();
  const { actor } = useAuth();
  const [recordings, setRecordings] = React.useState<AssignedRecording[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<ApiError | null>(null);

  const loadRecordings = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const nextRecordings = await userRecordingsApi.list();
      setRecordings(nextRecordings);
    } catch (err) {
      const apiError = err as ApiError;
      setError({
        code: apiError?.code,
        message: apiError?.message ?? "Failed to load your assigned practice.",
        statusCode: apiError?.statusCode ?? 500,
      });
      setRecordings([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadRecordings();
  }, [loadRecordings]);

  const studentName = actor ? deriveActorDisplayName(actor) : "Student";

  return (
    <Stack spacing={3.5}>
      <Box
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          borderRadius: 4,
          color: "#10243f",
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(240,246,255,0.94) 100%)",
          border: "1px solid rgba(55,125,205,0.12)",
          boxShadow: "0 24px 60px rgba(15, 23, 42, 0.06)",
        }}
      >
        <Stack spacing={1.25}>
          <Typography variant="overline" sx={{ letterSpacing: "0.08em", color: "primary.main" }}>
            Daily practice
          </Typography>
          <Typography variant="h4">Welcome back, {studentName}.</Typography>
          <Typography variant="body1" color="text.secondary">
            Open one recording when you are ready to practice. Notes and attachments stay with that session.
          </Typography>
        </Stack>
      </Box>

      <Stack spacing={1.25}>
        <Typography variant="h5">Assigned practice</Typography>
        <Typography variant="body2" color="text.secondary">
          Choose a recording to enter its dedicated practice screen.
        </Typography>
      </Stack>

      {isLoading ? (
        <Stack spacing={1.5} alignItems="center" sx={{ py: 8 }}>
          <CircularProgress size={32} />
          <Typography variant="body2" color="text.secondary">
            Loading your assigned practice...
          </Typography>
        </Stack>
      ) : error ? (
        <Stack spacing={1.5}>
          <Alert severity="error">{error.message}</Alert>
          <Box>
            <Button variant="outlined" onClick={() => void loadRecordings()}>
              Retry
            </Button>
          </Box>
        </Stack>
      ) : recordings.length === 0 ? (
        <Card
          variant="outlined"
          sx={{
            borderRadius: 4,
            p: 2,
            borderColor: "rgba(15, 23, 42, 0.08)",
            backgroundColor: "rgba(255,255,255,0.88)",
          }}
        >
          <CardContent sx={{ py: 5, textAlign: "center" }}>
            <QueueMusicRoundedIcon sx={{ fontSize: 42, color: "text.disabled", mb: 1 }} />
            <Typography variant="h6" fontWeight={700} gutterBottom>
              No assignments yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Assigned practice recordings will appear here as soon as your teacher shares them.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {recordings.map((recording) => (
            <Card
              key={recording.id}
              variant="outlined"
              sx={{
                borderRadius: 4,
                overflow: "hidden",
                borderColor: "rgba(15, 23, 42, 0.08)",
                boxShadow: "0 10px 24px rgba(15, 23, 42, 0.04)",
                backgroundColor: "rgba(255,255,255,0.94)",
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 2.75 } }}>
                <Stack spacing={2}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.5}
                    justifyContent="space-between"
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="h6" fontWeight={700} gutterBottom>
                        {recording.title}
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Chip
                          size="small"
                          color="primary"
                          label={recording.raag}
                          icon={<AlbumIcon />}
                        />
                        {recording.taal ? (
                          <Chip
                            size="small"
                            variant="outlined"
                            label={`Taal: ${recording.taal}`}
                          />
                        ) : null}
                      </Stack>
                    </Box>

                    <Typography variant="caption" color="text.secondary">
                      Assigned {formatAssignedAt(recording.assignedAt)}
                    </Typography>
                  </Stack>

                  <Typography variant="body2" color="text.secondary">
                    {recording.notes?.trim()
                      ? recording.notes.trim().slice(0, 160) +
                        (recording.notes.trim().length > 160 ? "..." : "")
                      : "No written notes for this recording."}
                  </Typography>

                  <Box>
                    <Button
                      variant="contained"
                      endIcon={<ChevronRightRoundedIcon />}
                      onClick={() => router.push(`/student-dashboard/practice?recordingId=${recording.id}`)}
                    >
                      Start practice
                    </Button>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
