"use client";

import { useSearchParams } from "next/navigation";
import { Alert, Box, Button, Stack } from "@mui/material";
import StudentRecordingPracticeScreen from "@/components/StudentDashboard/StudentRecordingPracticeScreen";
import { useRouter } from "next/navigation";

export default function StudentPracticePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recordingId = searchParams.get("recordingId");

  if (!recordingId) {
    return (
      <Stack spacing={1.5}>
        <Alert severity="error">
          No recording was selected for practice.
        </Alert>
        <Box>
          <Button variant="outlined" onClick={() => router.push("/student-dashboard")}>
            Back to assignments
          </Button>
        </Box>
      </Stack>
    );
  }

  return <StudentRecordingPracticeScreen recordingId={recordingId} />;
}
